"""
Everything CT ("Continuous Test" institute-wide slot) related.

CT is not a solver decision — CT_MATRIX statically fixes which weekday each
FY division holds its CT slot on (15:10–16:50). This module owns:

  * CT_MATRIX lookups (get_ct_day / is_ct_day / get_ct_divisions)
  * Populating CT_* batch groups dynamically from the Faculty sheet
  * CT room resolution/isolation (dedicated CT rooms vs. the generic lab pool)
  * Pinning CT batch sessions to their fixed slot inside the CP-SAT model
  * Blocking all OTHER sessions of a CT-day division from that slot
  * CT allocation reporting/display helpers

CTMixin is mixed into TimetableScheduler (see scheduler.py) — its methods
read/write the scheduler's shared self.* state exactly like the methods
defined directly on the class.
"""

import re

import pandas as pd
from ortools.sat.python import cp_model

from .config import BATCH_TO_DIVISION, CT_MATRIX, DIVISION_TO_BATCHES

# ══════════════════════════════════════════════════════════════════════
#  CT Batch Loader  —  reads CT batch groups from Faculty sheet (CT-DYN)
# ══════════════════════════════════════════════════════════════════════
#
# Called once inside load_data() after self.faculty_df is populated.
# Scans every row where Course Name == "CT" (case-insensitive) and
# collects the batch labels from the "Batch" column.
#
# Each distinct batch is assigned a synthetic CT_* group key using an
# auto-incrementing counter so the structure mirrors the old hardcoded
# DIVISION_TO_BATCHES entries.  Batches are grouped by their common
# alphabetical prefix (letters only, e.g. "AI11" → prefix "AI").
#
# The function:
#   1. Clears any existing CT_* keys from DIVISION_TO_BATCHES.
#   2. Adds new CT_<PREFIX><N> keys for each discovered prefix group.
#   3. Rebuilds BATCH_TO_DIVISION to stay consistent.
#
# No CT_MATRIX changes are made — the FY division→day mapping is fixed.
#


def _load_ct_batches_from_faculty(faculty_df: "pd.DataFrame") -> None:
    """Populate DIVISION_TO_BATCHES CT_* entries from Faculty sheet.

    Reads rows where Course Name is 'CT', collects unique batch labels
    from the 'Batch' column, groups them by alphabetical prefix, and
    inserts them as CT_<PREFIX><N> keys into DIVISION_TO_BATCHES.
    Also rebuilds BATCH_TO_DIVISION in-place.

    Parameters
    ----------
    faculty_df : pd.DataFrame
        The DataFrame read from the 'Faculty' sheet of the input workbook.
    """
    import re as _re

    # ── Step 1: collect all CT batch labels from Faculty sheet ──────────
    cols = {c.strip(): c for c in faculty_df.columns}

    def _col(name: str) -> str | None:
        return cols.get(name)

    course_col = _col("Course Name")
    batch_col = _col("Batch")

    if not course_col or not batch_col:
        print(
            "  ⚠ CT-DYN: 'Course Name' or 'Batch' column not found in Faculty sheet. "
            "CT batch groups will be empty."
        )
        return

    all_ct_batches: list[str] = []
    for _, row in faculty_df.iterrows():
        c_val = row.get(course_col)
        b_val = row.get(batch_col)
        if pd.isna(c_val) or str(c_val).strip().upper() != "CT":
            continue
        if pd.isna(b_val):
            continue
        # Batch cell may be comma/semicolon/space separated
        for token in _re.split(r"[,;\s]+", str(b_val).strip()):
            token = token.strip()
            if token and token.upper() != "NAN":
                all_ct_batches.append(token)

    if not all_ct_batches:
        print("  ⚠ CT-DYN: No CT batch rows found in Faculty sheet.")
        return

    # Deduplicate while preserving order
    seen: set[str] = set()
    unique_batches: list[str] = []
    for b in all_ct_batches:
        if b not in seen:
            seen.add(b)
            unique_batches.append(b)

    # ── Step 2: group batches by alphabetical prefix ─────────────────────
    # e.g. "AI11" → prefix "AI", "ROBO3" → prefix "ROBO", "ZEB1" → "ZEB"
    prefix_groups: dict[str, list[str]] = {}
    for b in unique_batches:
        m = _re.match(r"^([A-Za-z]+)", b)
        prefix = m.group(1).upper() if m else "CT"
        prefix_groups.setdefault(prefix, []).append(b)

    # ── Step 3: clear existing CT_* entries from DIVISION_TO_BATCHES ────
    old_ct_keys = [k for k in list(DIVISION_TO_BATCHES.keys()) if k.startswith("CT_")]
    for k in old_ct_keys:
        del DIVISION_TO_BATCHES[k]

    # ── Step 4: insert new CT_<PREFIX><N> group keys ──────────────────────
    # Each prefix gets its batches chunked into groups of up to 4
    # (matching the original structure where each group had 4 batches).
    # If a prefix has fewer than 4 batches, they all go in one group.
    CHUNK = 4
    added_groups = 0
    for prefix, batches in sorted(prefix_groups.items()):
        # Split into chunks of CHUNK
        chunks = [batches[i : i + CHUNK] for i in range(0, len(batches), CHUNK)]
        for idx, chunk in enumerate(chunks, start=1):
            if len(chunks) == 1:
                group_key = f"CT_{prefix}"
            else:
                group_key = f"CT_{prefix}{idx}"
            DIVISION_TO_BATCHES[group_key] = chunk
            added_groups += 1

    # ── Step 5: rebuild BATCH_TO_DIVISION ────────────────────────────────
    BATCH_TO_DIVISION.clear()
    for div, batches in DIVISION_TO_BATCHES.items():
        for b in batches:
            BATCH_TO_DIVISION[b] = div

    print(
        f"  ✓ CT-DYN: loaded {len(unique_batches)} CT batches → "
        f"{added_groups} CT_* groups from Faculty sheet "
        f"({sorted(prefix_groups.keys())})"
    )


def _build_ct_batches_by_day() -> dict[int, list[str]]:
    """Map CT day index (0=Mon…3=Thu) to sorted list of active CT batch names.

    Batch suffix 1→day 0 (Mon), 2→day 1 (Tue), 3→day 2 (Wed), 4→day 3 (Thu).
    Used by _print_ct_allocation() and save_timetable() for the CT Allocation sheet.
    """
    result: dict[int, list[str]] = {}
    for ct_key, batches in DIVISION_TO_BATCHES.items():
        if not ct_key.startswith("CT_"):
            continue
        for batch in batches:
            m = re.search(r"(\d+)$", batch)
            if m:
                suffix = int(m.group(1)[-1])
                if 1 <= suffix <= 4:
                    result.setdefault(suffix - 1, []).append(batch)
    for day_idx in result:
        result[day_idx].sort()
    return result


# ── CT helper functions ───────────────────────────────────────────────────────


def get_ct_day(division: str) -> int | None:
    """Return the 0-based day index on which *division* holds CT.

    Returns None if the division is not in CT_MATRIX (i.e. not a FY division
    with a CT slot).  Day index 0 = Monday … 6 = Sunday.

    Examples
    --------
    >>> get_ct_day("CS1")
    0          # Monday
    >>> get_ct_day("CS3")
    2          # Wednesday
    >>> get_ct_day("CT_AI1")
    None       # CT track groups are not in CT_MATRIX
    """
    row = CT_MATRIX.get(division)
    if row is None:
        return None
    try:
        return row.index(1)
    except ValueError:
        return None  # malformed row (should not happen after validation)


def is_ct_day(division: str, day: int) -> bool:
    """Return True iff CT_MATRIX says *division* holds CT on *day*.

    Parameters
    ----------
    division : str
        FY division key (e.g. "CS1", "IT2").
    day : int
        0-based day index (0=Monday … 6=Sunday).

    Returns False for any division not in CT_MATRIX (CT track groups, etc.).
    """
    row = CT_MATRIX.get(division)
    if row is None or day < 0 or day >= len(row):
        return False
    return row[day] == 1


def get_ct_divisions(day_index):
    divisions = []
    for div, matrix in CT_MATRIX.items():
        if matrix[day_index] == 1:
            divisions.append(div)
    return divisions


class CTMixin:
    """CT-specific instance methods, mixed into TimetableScheduler."""

    # ──────────────────────────────────────────────────────────────
    # CT room resolver
    # ──────────────────────────────────────────────────────────────
    def _ct_rooms_for(self, label: str) -> list[str]:
        """Return allowed rooms for a CT batch.

        Priority:
        1. Exact batch mapping from CT_Rooms sheet.
        2. All lab rooms fallback.
        """
        batch = label.strip().upper()

        if hasattr(self, "ct_room_map") and batch in self.ct_room_map:
            return [self.ct_room_map[batch]]

        return list(self.all_lab_rooms)

    # ──────────────────────────────────────────────────────────────
    # CT room registration/isolation + CT slot index discovery
    # (called from load_data() once Rooms/Time sheets are parsed)
    # ──────────────────────────────────────────────────────────────
    def _setup_ct_rooms_and_slots(self) -> None:
        # ── CT rooms: register dedicated CT rooms and isolate them ───────────
        #
        # Three things must happen:
        #
        # 1. REGISTER: Every room named in CT_Rooms must be in self.all_lab_rooms
        #    so that room no-overlap intervals (C2) are created for it.
        #    Some CT rooms appear in the Rooms sheet as "Theory" (e.g. D302 used
        #    by ROBO track) — those must be moved from self.theory_rooms to
        #    self.all_lab_rooms so they participate in the lab interval pool.
        #    Rooms not in the Rooms sheet at all are appended fresh.
        #
        # 2. ISOLATE: CT-dedicated rooms must NOT remain in the generic lab pool
        #    (self.all_lab_rooms entries that non-CT sessions receive via
        #    _lab_rooms_for()). If they stay in the pool, EDS/DV/FAB-LAB sessions
        #    compete for H204A and crowd out CT sessions at solve time.
        #    We maintain a separate set self.ct_dedicated_rooms and strip those
        #    rooms from self.all_lab_rooms after registration so that
        #    _lab_rooms_for() never returns them.
        #
        # 3. VALIDATE: After registration, verify every mapped CT room is now in
        #    self.all_lab_rooms so that the parse_sessions check works.
        #
        if hasattr(self, "ct_room_map"):
            # Collect the unique set of rooms referenced by CT_Rooms sheet
            ct_dedicated = sorted(set(self.ct_room_map.values()))

            # Build fast-lookup sets (upper-cased for case-insensitive compare)
            lab_upper = {r.upper(): r for r in self.all_lab_rooms}
            theory_upper = {r.upper(): r for r in self.theory_rooms}

            added_new, moved_from_theory = [], []

            for room in ct_dedicated:
                ru = room.upper()
                if ru in lab_upper:
                    # Already in all_lab_rooms — nothing to do for registration.
                    pass
                elif ru in theory_upper:
                    # Room is registered as Theory; move it to lab pool so that
                    # the interval builder creates a lab-type no-overlap for it.
                    self.theory_rooms.remove(theory_upper[ru])
                    self.all_lab_rooms.append(room)
                    lab_upper[ru] = room
                    moved_from_theory.append(room)
                else:
                    # Room is completely new (not in Rooms sheet at all).
                    self.all_lab_rooms.append(room)
                    lab_upper[ru] = room
                    added_new.append(room)

            # Now ISOLATE: remove every CT-dedicated room from self.all_lab_rooms
            # so _lab_rooms_for() never hands them to non-CT sessions.
            # We keep them in a separate registry so parse_sessions can check them.
            self.ct_dedicated_rooms: set[str] = set(ct_dedicated)
            ct_dedicated_upper = {r.upper() for r in ct_dedicated}
            self.all_lab_rooms = [
                r for r in self.all_lab_rooms if r.upper() not in ct_dedicated_upper
            ]

            if added_new or moved_from_theory:
                print(
                    f"  ✓ CT-Rooms: registered "
                    f"{len(added_new)} new + {len(moved_from_theory)} theory→lab rooms: "
                    f"{added_new + moved_from_theory}"
                )
            print(
                f"  ✓ CT-Rooms: {len(ct_dedicated)} rooms isolated from generic pool "
                f"(non-CT sessions cannot use them)."
            )
        else:
            self.ct_dedicated_rooms = set()
        # ─────────────────────────────────────────────────────────────────

        # ── CT-K: Compute CT local slot indices dynamically ───────────────
        #
        # CT runs Mon-Thu at 15:10–16:50 spanning TWO consecutive slots:
        #   Slot 1 (ct_fixed_slot):   15:10–16:00
        #   Slot 2 (ct_fixed_slot+1): 16:00–16:50
        #
        # We scan the Time sheet for the slot whose start time is "15:10"
        # and store its LOCAL index.  The second slot is always ct_fixed_slot+1.
        # Global positions per day are computed inside build_model().
        #
        # self.ct_fixed_slot  : 1-based local index for the 15:10 slot (-1 = not found)
        # self.ct_fixed_slot2 : 1-based local index for the 16:00 slot (-1 = not found)
        #
        ct_slot_local = -1
        ct_slot_local2 = -1
        sorted_slots = sorted(self.time_slots.items())  # [(idx, slot_str), ...]
        for i, (slot_idx, slot_str) in enumerate(sorted_slots):
            start_time = slot_str.split("-")[0].strip()
            if start_time.startswith("15:10"):
                ct_slot_local = slot_idx
                # The very next slot in the Time sheet is the 16:00–16:50 period
                if i + 1 < len(sorted_slots):
                    ct_slot_local2 = sorted_slots[i + 1][0]
                else:
                    ct_slot_local2 = slot_idx + 1  # best guess
                break
        if ct_slot_local == -1:
            # Fallback: last usable slot (not lunch)
            usable = [idx for idx in sorted(self.time_slots) if idx != self.lunch_slot]
            ct_slot_local = usable[-1] if usable else sorted(self.time_slots)[-1]
            ct_slot_local2 = ct_slot_local + 1
            print(
                f"  WARNING CT-K: No 15:10 slot found in Time sheet -- "
                f"falling back to local slot {ct_slot_local} "
                f"({self.time_slots.get(ct_slot_local, '?')})"
            )
        # Store both local slot indices; global positions computed in build_model()
        self.ct_fixed_slot = ct_slot_local  # 15:10–16:00 (1-based local index)
        self.ct_fixed_slot2 = ct_slot_local2  # 16:00–16:50 (1-based local index)
        print(
            f"  OK CT-K: CT slots = [{ct_slot_local}, {ct_slot_local2}] "
            f"({self.time_slots.get(ct_slot_local, '?')} / "
            f"{self.time_slots.get(ct_slot_local2, '?')})  "
            f"[blocks Mon-Thu 15:10-16:50 for CT divisions]"
        )
        # ─────────────────────────────────────────────────────────────────

    # ──────────────────────────────────────────────────────────────
    # CT-P: pin CT batch sessions to their fixed 15:10 slot
    # (called from build_model()'s per-session loop)
    # ──────────────────────────────────────────────────────────────
    def _build_ct_pin_slots(self) -> dict[int, int]:
        """global_per_day[day_idx] = global start slot for 15:10 on that day.

        Built from self.ct_fixed_slot which was set in _setup_ct_rooms_and_slots().
        Needed before the session loop in build_model() to pin CT batch sessions.
        """
        tspd = self.time_slots_per_day
        global_per_day: dict[int, int] = {}
        if self.ct_fixed_slot >= 1:
            for d in range(len(self.days)):
                global_per_day[d] = d * tspd + (self.ct_fixed_slot - 1)
        return global_per_day

    def _pin_ct_batch_session(
        self,
        sess: dict,
        start: cp_model.IntVar,
        placed,
        frozen,
        ct_global_per_day: dict[int, int],
    ) -> None:
        """Pin CT batch sessions (course=="CT", tagged ct_batch=True in
        parse_sessions) to exactly the 15:10 slot on the FY division's CT day.

        This is a hard constraint:
          placed == 1  (must be scheduled, no optional placement)
          start == g_ct  (exactly the 15:10 global slot for CT day)

        The owning FY division is found via:
          batch → BATCH_TO_DIVISION → CT_* group → CT_MATRIX lookup
        For CT batches the div_family is their CT_* group key (e.g. "CT_AI").
        We resolve the FY day from CT_MATRIX by looking at which FY divisions
        share the same day as this batch's suffix.

        Suffix rule: last digit of batch number → day index (1=Mon…4=Thu).
        This mirrors the original CT_MATRIX assignment.
        """
        if sess.get("ct_batch") and frozen is None:
            _batch_lbl = str(sess.get("entity", ""))
            _m = re.search(r"(\d+)$", _batch_lbl)
            if _m:
                _last = int(_m.group(1)[-1])  # last digit: 1-4
                _ct_day_idx = _last - 1  # 0=Mon,1=Tue,2=Wed,3=Thu
                if 0 <= _ct_day_idx <= 3:
                    _g_ct = ct_global_per_day.get(_ct_day_idx, -1)
                    if _g_ct >= 0:
                        # Hard pin: this session must be placed at 15:10
                        self.model.Add(placed == 1)
                        self.model.Add(start == _g_ct)

    # ──────────────────────────────────────────────────────────────
    # CT-R: block every OTHER session of a CT-day division from the
    # 15:10/16:00 CT slots (called once from build_model() after the
    # per-session loop)
    # ──────────────────────────────────────────────────────────────
    def _apply_ct_blocking(self) -> None:
        """CT reserved-slot blocking (v16, data-driven).

        DESIGN: CT allocation is 100% data-driven via CT_MATRIX.
        get_ct_day(division) returns the fixed day index for a division.
        No solver variables are created for CT days.

        CT occupies TWO fixed global slots per CT day:
          g_ct  (15:10–16:00) — derived from self.ct_fixed_slot
          g_ct2 (16:00–16:50) — derived from self.ct_fixed_slot2

        Blocking rules for every session owned by a CT_MATRIX division
        on its assigned CT day:

          R1: start != g_ct             (would occupy the 15:10 slot)
          R2: start != g_ct2            (would occupy the 16:00 slot)
          R3: start != g_ct - 1 [lab]  (dur=2 lab spanning into 15:10)

        These constraints are enforced unconditionally for ALL session
        types (Theory, Tutorial, Lab) belonging to those divisions.
        Only CT batch sessions themselves (course=="CT") are excluded
        from self.sessions entirely (CT-A in parse_sessions).
        """
        _ct_local_slot = self.ct_fixed_slot  # 15:10 local slot (1-based)
        _ct_local_slot2 = self.ct_fixed_slot2  # 16:00 local slot (1-based)
        tspd = self.time_slots_per_day

        # Global CT slot positions for every day: keyed by 0-based day index.
        # Slot 1 (15:10) and Slot 2 (16:00) are stored separately so we
        # never assume they are numerically adjacent (handles gaps).
        ct_global_per_day: dict[int, int] = {}  # 15:10 slot global index
        ct_global2_per_day: dict[int, int] = {}  # 16:00 slot global index
        for day_idx in range(len(self.days)):
            if _ct_local_slot >= 1:
                ct_global_per_day[day_idx] = day_idx * tspd + (_ct_local_slot - 1)
            if _ct_local_slot2 >= 1:
                ct_global2_per_day[day_idx] = day_idx * tspd + (_ct_local_slot2 - 1)

        # Announce CT slot pair for verification
        for day_idx in range(min(4, len(self.days))):
            g1 = ct_global_per_day.get(day_idx, -1)
            g2 = ct_global2_per_day.get(day_idx, -1)
            day_label = self.days[day_idx]
            s1 = self.global_to_day_slot.get(g1, (None, -1))[1]
            s2 = self.global_to_day_slot.get(g2, (None, -1))[1]
            print(
                f"  CT block day {day_idx} ({day_label}): "
                f"slot1=g{g1}(local={s1}, {self.time_slots.get(s1,'?')})  "
                f"slot2=g{g2}(local={s2}, {self.time_slots.get(s2,'?')})"
            )

        all_valid = set(self.allowed_theory_starts) | set(self.allowed_lab_starts)
        all_lab_valid = set(self.allowed_lab_starts)
        ct_r_constraints = 0

        for sess in self.sessions:
            sid_s = sess["id"]
            start_v = self.session_starts[sid_s]
            dur_s = sess["duration"]
            placed_v = sess["placed_var"]

            # ── Identify the owning FY division ───────────────────────────
            # A session is owned by a CT-blocked division when:
            #   (a) it is a division session whose entity is in CT_MATRIX, OR
            #   (b) its div_family maps to a CT_MATRIX division.
            # CT-track pseudo-divisions (CT_*) are NOT in CT_MATRIX and their
            # actual sessions (course="CT") are excluded in parse_sessions, so
            # we never reach this loop for them.
            if sess["etype"] == "division" and sess["entity"] in CT_MATRIX:
                owning_div = sess["entity"]
            elif sess.get("div_family") and sess["div_family"] in CT_MATRIX:
                owning_div = sess["div_family"]
            else:
                continue  # not linked to a CT_MATRIX division

            k = get_ct_day(owning_div)
            if k is None:
                continue

            g_ct = ct_global_per_day.get(k, -1)  # 15:10 global slot
            g_ct2 = ct_global2_per_day.get(k, -1)  # 16:00 global slot

            # ── R1: block starting at 15:10 slot ─────────────────────────
            if g_ct >= 0 and g_ct in all_valid:
                self.model.Add(start_v != g_ct).OnlyEnforceIf(placed_v)
                ct_r_constraints += 1

            # ── R2: block starting at 16:00 slot ─────────────────────────
            # Explicitly uses ct_fixed_slot2 (not g_ct+1) so we are correct
            # even when time slots are not unit-spaced in the global domain.
            if g_ct2 >= 0 and g_ct2 in all_valid:
                self.model.Add(start_v != g_ct2).OnlyEnforceIf(placed_v)
                ct_r_constraints += 1

            # ── R3: block lab (dur=2) from bridging into the 15:10 slot ──
            # A lab starting at g_ct-1 would occupy [g_ct-1, g_ct+1) and
            # overlap the first CT slot.
            if dur_s == 2 and g_ct >= 1 and (g_ct - 1) in all_lab_valid:
                self.model.Add(start_v != (g_ct - 1)).OnlyEnforceIf(placed_v)
                ct_r_constraints += 1

        print(
            f"  OK CT-R: {ct_r_constraints} CT blocking constraints added "
            f"(15:10 + 16:00 slots blocked for CT-day divisions)"
        )

    # ──────────────────────────────────────────────────────────────
    # CT Allocation helpers  (data-driven, no solver query)
    # ──────────────────────────────────────────────────────────────
    @staticmethod
    def _build_ct_allocation_from_matrix() -> dict[int, list[str]]:
        """Build ct_allocation dict directly from CT_MATRIX.

        Returns a dict mapping day_index (0-based) → sorted list of divisions
        whose CT slot falls on that day.  Called once at __init__ time.
        """
        allocation: dict[int, list[str]] = {}
        for div, row in CT_MATRIX.items():
            try:
                day_idx = row.index(1)
            except ValueError:
                continue
            allocation.setdefault(day_idx, []).append(div)
        for day_idx in allocation:
            allocation[day_idx].sort()
        return allocation

    def _print_ct_allocation(self):
        """Print CT allocation table to console (from CT_MATRIX — no solver needed)."""
        ct_batches_by_day = _build_ct_batches_by_day()

        print("\n" + "=" * 60)
        print("  CT ALLOCATION  (15:10–16:50)  [source: CT_MATRIX]")
        print("=" * 60)

        # Print every day that has at least one division assigned in CT_MATRIX
        assigned_days = sorted(self.ct_allocation.keys())
        for day_idx in assigned_days:
            day_name = (
                self.days[day_idx] if day_idx < len(self.days) else f"Day{day_idx}"
            )
            divs = self.ct_allocation.get(day_idx, [])
            active_batches = ct_batches_by_day.get(day_idx, [])

            print(f"\n  ## {day_name.upper()}")
            print(f"  {'─' * 30}")
            print(f"  Divisions ({len(divs)}):")
            for div in divs:
                print(f"    {div}")
            if active_batches:
                print(f"  Active CT batches ({len(active_batches)}):")
                print("    " + "  ".join(active_batches))
            else:
                print("  Active CT batches: (none)")

        # Summary counts per day
        print(f"\n  Summary:")
        for day_idx in assigned_days:
            day_name = (
                self.days[day_idx] if day_idx < len(self.days) else f"Day{day_idx}"
            )
            cnt = len(self.ct_allocation.get(day_idx, []))
            bar = "█" * cnt
            print(f"    {day_name:<12} {cnt:3d}  {bar}")
        print("=" * 60)

    # ────────────────────────────────────────────────────────────────────
    #  Display-schedule helpers (CT-DISP)
    #
    #  These are part of the *only* place that decides how the raw solver
    #  output (extract_solution() rows) gets turned into the timetable
    #  representation that humans see — whether that's an Excel sheet or a
    #  JSON payload handed to Flask/MongoDB/the website.
    #
    #  They are pure post-processing over already-placed sessions: no
    #  solver state, constraint, or objective is touched, and nothing here
    #  can change which sessions get scheduled or how many are left
    #  unscheduled.
    # ────────────────────────────────────────────────────────────────────
    def _ct_slot_label(self, local_idx: int) -> str:
        """Format a local time-slot index as an en-dash 'HH:MM–HH:MM' label."""
        raw = self.time_slots.get(local_idx, "")
        parts = raw.split("-")
        if len(parts) == 2:
            return f"{parts[0].strip()}–{parts[1].strip()}"
        return raw

    def _ct_placeholder_rows(self, division: str) -> list[dict]:
        """Build the generic 'CT' placeholder rows shown for *division*.

        Division-level views (Excel E_* sheets, website division view) must
        show CT as a plain institution-wide block — Course/Type "CT", no
        Faculty, no Room — never the underlying CT track/faculty/room.
        Returns [] for anything not in CT_MATRIX (CT track groups, etc.),
        so it can never affect scheduling or the unscheduled count.
        """
        day_idx = get_ct_day(division)
        if day_idx is None or day_idx >= len(self.days):
            return []
        day_name = self.days[day_idx]
        ct_time1 = self._ct_slot_label(self.ct_fixed_slot)
        ct_time2 = self._ct_slot_label(self.ct_fixed_slot2)
        base = {
            "Faculty": "",
            "Course": "CT",
            "Div/Batch": division,
            "Division": division,
            "Type": "CT",
            "Room": "",
        }
        return [
            {"Day": day_name, "Time": ct_time1, **base},
            {"Day": day_name, "Time": ct_time2, **base},
        ]
