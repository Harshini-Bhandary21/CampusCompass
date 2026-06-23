#!/usr/bin/env python3
"""
Timetable Scheduler — CP-SAT  (v16 — CT data-driven static matrix)

CT days are assigned via CT_MATRIX (static dict, not solver variables).
Objective: 4-level (P1 placement, P2 max−min imbalance, P3 deviation, P4 Saturday).
OR-Tools 9.15 API compatibility maintained.

To move CT_MATRIX to Excel: replace the literal below with a loader function.
No solver logic changes are required.
"""

import re
import time
from collections import defaultdict, Counter

import pandas as pd
from ortools.sat.python import cp_model

# ══════════════════════════════════════════════════════════════════════
#  Division → Batch hierarchy
# ══════════════════════════════════════════════════════════════════════
DIVISION_TO_BATCHES: dict[str, list[str]] = {
    "AL1": ["A11", "A12", "A13", "A14", "A15"],
    "AL2": ["A21", "A22", "A23", "A24", "A25"],
    "CS1": ["C11", "C12", "C13", "C14", "C15"],
    "CS2": ["C21", "C22", "C23", "C24", "C25"],
    "CS3": ["C31", "C32", "C33", "C34", "C35"],
    "CS4": ["C41", "C42", "C43", "C44", "C45"],
    "IT1": ["I11", "I12", "I13", "I14", "I15"],
    "IT2": ["I21", "I22", "I23", "I24", "I25"],
    "ET1": ["E11", "E12", "E13", "E14", "E15"],
    "ET2": ["E21", "E22", "E23", "E24", "E25"],
    "SE1": ["S11", "S12", "S13", "S14", "S15"],
    "SE2": ["S21", "S22", "S23", "S24", "S25"],
    "ME1": ["M11", "M12", "M13"],
    "ME2": ["M21", "M22", "M23"],
    "DS1": ["D11", "D12", "D13"],
    "DS2": ["D21", "D22", "D23"],
    "CV": ["CV1", "CV2", "CV3"],
    "CH": ["CH1", "CH2", "CH3"],
    "CT_AI1": ["AI11", "AI12", "AI13", "AI14"],
    "CT_AI2": ["AI21", "AI22", "AI23", "AI24"],
    "CT_AI3": ["AI31", "AI32", "AI33", "AI34"],
    "CT_AI4": ["AI41", "AI42", "AI43", "AI44"],
    "CT_AI5": ["AI51", "AI52", "AI53", "AI54"],
    "CT_AR1": ["AR11", "AR12", "AR13", "AR14"],
    "CT_AR2": ["AR21", "AR22", "AR23", "AR24"],
    "CT_PE1": ["PE11", "PE12", "PE13", "PE14"],
    "CT_PE2": ["PE21", "PE22", "PE23", "PE24"],
    "CT_PE3": ["PE31", "PE32", "PE33", "PE34"],
    "CT_PE4": ["PE41", "PE42", "PE43", "PE44"],
    "CT_BCT1": ["BCT11", "BCT12", "BCT13", "BCT14"],
    "CT_BCT2": ["BCT21", "BCT22", "BCT23", "BCT24"],
    "CT_ROBO": ["ROBO1", "ROBO2", "ROBO3", "ROBO4"],
    "CT_CC": ["CC1", "CC2", "CC3", "CC4"],
    "CT_IOT": ["IOT1", "IOT2", "IOT3", "IOT4"],
    "CT_EV": ["EV1", "EV2", "EV3", "EV4"],
    "CT_ZEB": ["ZEB1", "ZEB2", "ZEB3", "ZEB4"],
    "CT_DRONE": ["DRONE1", "DRONE2", "DRONE3", "DRONE4"],
    "CT_AECE": ["AECE1", "AECE2", "AECE3", "AECE4"],
}

BATCH_TO_DIVISION: dict[str, str] = {
    b: div for div, batches in DIVISION_TO_BATCHES.items() for b in batches
}

COURSE_LAB_MAP: dict[str, str] = {
    "engineering physics": "Engineering Physics Lab",
    "foundation of computing": "Foundation of Computing Lab",
    "science of nature (son-chem)": "Science of Nature (SON-Chem) Lab",
    "applied mechanics": "Applied Mechanics Lab",
    "design thinking": "Design Thinking Lab",
    "electronics and electrical": "Electronics and Electrical Engineering Lab",
    "communication skills english": "English For Communication",
    "english for communication": "English For Communication",
    "linux fundamentals": "Linux Fundamentals Lab",
    "physics": "Engineering Physics Lab",
    "son(chem)": "Science of Nature (SON-Chem) Lab",
    "computer aided chemical": "Science of Nature (SON-Chem) Lab",
    "cace": "Science of Nature (SON-Chem) Lab",
    "surveying": "Applied Mechanics Lab",
    "s&g": "Applied Mechanics Lab",
}

COURSE_LAB_ABBREV_EXACT: dict[str, str] = {
    "am": "Applied Mechanics Lab",
    "dt": "Design Thinking Lab",
    "dee": "Electronics and Electrical Engineering Lab",
    "ieee,dee": "Electronics and Electrical Engineering Lab",
    "ieee, dee": "Electronics and Electrical Engineering Lab",
    "isa": "Electronics and Electrical Engineering Lab",
    "lsa": "Linux Fundamentals Lab",
    "linux": "Linux Fundamentals Lab",
    "foc": "Foundation of Computing Lab",
    "ep": "Engineering Physics Lab",
    "son": "Science of Nature (SON-Chem) Lab",
}

# Weights for the objective — higher = solver tries harder to place these.
# Labs get 3× because a missed lab requires manual intervention (room booking,
# faculty coordination across 2 consecutive slots). Adjust as needed.
SESSION_WEIGHTS = {"Lab": 3, "Tutorial": 2, "Theory": 1}

# ── CT-5: CT Track → Lab room mapping ────────────────────────────────────────
#
# Maps CT track keywords (matched against the batch/entity label, case-insensitive)
# to lists of preferred lab room names.  The matching is done with a simple
# substring check so "AI11", "AI_DIV2", etc. all hit the "ai" key.
#
# HOW TO EXTEND:
#   Add a new key (lowercase keyword) and a list of room name strings.
#   The names must exactly match entries in the Rooms sheet.
#   Example:
#       "cybersecurity": ["Cyber Lab 1", "Cyber Lab 2"],
#
# If no key matches the session label, _ct_rooms_for() falls back to
# self.all_lab_rooms (all 26 lab rooms) — preserving existing behaviour.
#
CT_ROOM_MAPPING: dict[str, list[str]] = {
    "ai": [],  # e.g. ["AI Lab 1", "AI Lab 2"]
    "iot": [],  # e.g. ["IoT Lab"]
    "robo": [],  # e.g. ["Robotics Lab"]
    "robot": [],  # alias for "robo"
    "cc": [],  # Cloud Computing
    "cloud": [],  # alias for "cc"
    "ev": [],  # Electric Vehicles
    "drone": [],  # Drone lab
    "ar": [],  # AR / VR
    "vr": [],  # alias for "ar"
    "bct": [],  # Blockchain Technology
    "pe": [],  # Power Electronics
    "zeb": [],  # Zero Energy Buildings
    "aece": [],  # AECE track
}
# NOTE: All lists above are intentionally empty until real room names are
# populated.  An empty list triggers the fallback to self.all_lab_rooms,
# so the scheduler works correctly out-of-the-box with no Excel changes.

# ── Objective tuning constants ────────────────────────────────────────────────
#
# Hierarchy (descending priority):
#   P1: BIG_M × weighted_placed              — never trade a session for balance
#   P2: BALANCE_WEIGHT × imbalance           — penalise max−min day spread
#   P3: DEV_WEIGHT × Σ|day_load[d]−avg|     — penalise mean-absolute deviation
#   P4: SAT_PENALTY × saturday_load          — discourage Saturday overflow
#
# Separation guarantee:
#   BIG_M > BALANCE_WEIGHT × max_imbalance (≤ n_sessions)
#   so placing one more session ALWAYS beats any reduction in imbalance.
#
BALANCE_WEIGHT = 5  # secondary objective coefficient
DEV_WEIGHT = 1  # tertiary deviation coefficient
SAT_PENALTY = 1  # Saturday penalty coefficient

# FY divisions that receive a CT day assignment.
# These are all keys in DIVISION_TO_BATCHES that do NOT start with "CT_".
# CT_* pseudo-divisions (AI1, AR1, etc.) are the track entities; they are
# NOT assigned a CT day because they ARE the CT tracks.
FY_DIVISIONS: list[str] = [
    div for div in DIVISION_TO_BATCHES if not div.startswith("CT_")
]

# ══════════════════════════════════════════════════════════════════════
#  CT_MATRIX  —  Static data-driven CT day allocation  (CT-O)
# ══════════════════════════════════════════════════════════════════════
#
# Maps every FY division to a 7-element binary list:
#   Index:  0=Monday  1=Tuesday  2=Wednesday  3=Thursday
#           4=Friday  5=Saturday  6=Sunday
#
# Rules:
#   • Exactly ONE element must be 1 per division (one CT day per week).
#   • CT always occupies the 15:10–16:50 slot on the assigned day.
#   • The solver does NOT choose or optimise CT days — this matrix is final.
#
# FUTURE: To move this into an Excel sheet, replace this dict literal with
# a loader function that reads the "CT Matrix" sheet from the input workbook.
# The solver logic (get_ct_day / is_ct_day / CT blocking) does not change.
#
CT_MATRIX: dict[str, list[int]] = {
    #           Mon Tue Wed Thu Fri Sat Sun
    "AL1": [1, 0, 0, 0, 0, 0, 0],
    "AL2": [0, 1, 0, 0, 0, 0, 0],
    "CS1": [1, 0, 0, 0, 0, 0, 0],
    "CS2": [0, 1, 0, 0, 0, 0, 0],
    "CS3": [0, 0, 1, 0, 0, 0, 0],
    "CS4": [0, 0, 0, 1, 0, 0, 0],
    "IT1": [1, 0, 0, 0, 0, 0, 0],
    "IT2": [0, 1, 0, 0, 0, 0, 0],
    "ET1": [0, 0, 1, 0, 0, 0, 0],
    "ET2": [0, 0, 0, 1, 0, 0, 0],
    "SE1": [1, 0, 0, 0, 0, 0, 0],
    "SE2": [0, 1, 0, 0, 0, 0, 0],
    "ME1": [0, 0, 1, 0, 0, 0, 0],
    "ME2": [0, 0, 0, 1, 0, 0, 0],
    "DS1": [1, 0, 0, 0, 0, 0, 0],
    "DS2": [0, 1, 0, 0, 0, 0, 0],
    "CV": [0, 0, 1, 0, 0, 0, 0],
    "CH": [0, 0, 0, 1, 0, 0, 0],
}


#
# Validate matrix at import time: every row must have exactly one 1.
def _validate_ct_matrix() -> None:
    errors = []
    for div, row in CT_MATRIX.items():
        if len(row) != 7:
            errors.append(f"  CT_MATRIX['{div}']: expected 7 columns, got {len(row)}")
        ones = sum(row)
        if ones != 1:
            errors.append(
                f"  CT_MATRIX['{div}']: must have exactly 1 CT day, found {ones}"
            )
    if errors:
        raise ValueError("CT_MATRIX validation failed:\n" + "\n".join(errors))


_validate_ct_matrix()


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


def parse_cell(cell) -> list[str]:
    if pd.isna(cell) or str(cell).strip() in ("", "nan"):
        return []
    return [
        t.strip().lstrip("*")
        for t in re.split(r"[,]+", str(cell).strip())
        if t.strip().lstrip("*")
    ]


def safe_int(val, default: int = 0) -> int:
    try:
        return int(float(val)) if pd.notna(val) else default
    except Exception:
        return default


# ══════════════════════════════════════════════════════════════════════
class TimetableScheduler:

    def __init__(self):
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()

        self.faculty_df = self.room_df = self.time_df = None

        self.time_slots: dict[int, str] = {}
        self.time_slots_per_day = 9
        self.lunch_slot = 5

        self.days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        self.online_days: list[int] = [0, 0, 0, 0, 0, 1]

        self.theory_rooms: list[str] = []
        self.subject_lab_rooms: dict[str, list[str]] = {}
        self.all_lab_rooms: list[str] = []

        self.sessions: list[dict] = []

        self.session_starts: dict[int, cp_model.IntVar] = {}
        self.session_ends: dict[int, cp_model.IntVar] = {}
        self.session_intervals: dict[int, cp_model.IntervalVar] = {}
        self.session_room_bools: dict[int, dict] = defaultdict(dict)

        self.global_to_day_slot: dict[int, tuple] = {}
        self.allowed_theory_starts: list[int] = []
        self.allowed_lab_starts: list[int] = []
        self.online_global: set[int] = set()
        self.offline_global: set[int] = set()

        # Set by build_model; used in diagnostic report
        self._day_load_vars: list[cp_model.IntVar] = []
        self._imbalance_var: cp_model.IntVar | None = None
        self._dev_vars: list[cp_model.IntVar] = []

        # CT support: fixed slot set in load_data(); allocation from CT_MATRIX
        self.ct_fixed_slot: int = -1  # local slot index (1-based)
        self.ct_allocation: dict[int, list[str]] = (
            self._build_ct_allocation_from_matrix()
        )

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
    # STEP 1 — Load
    # ──────────────────────────────────────────────────────────────
    def load_data(self, excel_file: str) -> bool:
        print("=" * 70)
        print("  TIMETABLE SCHEDULER  v16  --  CT data-driven static matrix")
        print("=" * 70)
        print("\n[1/6] Loading data …")
        try:
            self.faculty_df = pd.read_excel(excel_file, sheet_name="Faculty")
            self.room_df = pd.read_excel(excel_file, sheet_name="Rooms")

            # ---------------------------------------------------
            # CT Room Mapping
            # ---------------------------------------------------
            try:
                ct_df = pd.read_excel(excel_file, sheet_name="CT_Rooms")

                self.ct_room_map = {}

                for _, row in ct_df.iterrows():
                    batch = str(row["Batch"]).strip().upper()
                    room = str(row["Room"]).strip()  # preserve original casing
                    self.ct_room_map[batch] = room

                print(f"  ✓ CT room mappings loaded: " f"{len(self.ct_room_map)}")

            except Exception:
                self.ct_room_map = {}
                print("  ℹ No CT_Rooms sheet found")

            self.time_df = pd.read_excel(excel_file, sheet_name="Time")
        except Exception as e:
            print(f"  ✗ {e}")
            return False

        for _, r in self.time_df.iterrows():
            self.time_slots[int(r["Index"])] = str(r["Slot"]).strip()
        self.time_slots_per_day = len(self.time_slots)
        s = sorted(self.time_slots)
        self.lunch_slot = 5 if 5 in self.time_slots else s[len(s) // 2]

        self.subject_lab_rooms = {}
        for _, r in self.room_df.iterrows():
            name = str(r["Rooms"]).strip()
            rtype = str(r.get("Type", "Theory")).strip().lower()
            subj = (
                str(r.get("Subject", "")).strip()
                if pd.notna(r.get("Subject", ""))
                else ""
            )
            if rtype == "theory":
                self.theory_rooms.append(name)
            else:
                self.all_lab_rooms.append(name)
                if subj:
                    self.subject_lab_rooms.setdefault(subj, []).append(name)

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

        # ── CT-K: Compute CT local slot index dynamically ─────────────────
        #
        # CT runs Mon-Thu at 15:10-16:50.  We scan the Time sheet for the slot
        # whose start time is "15:10" and store just the LOCAL slot index.
        # The global slot per day is computed inside build_model() for days 0-3.
        #
        # self.ct_fixed_slot holds the LOCAL slot index (1-based, matching the
        # Time sheet Index column).  -1 means not found.
        #
        ct_slot_local = -1
        for slot_idx, slot_str in self.time_slots.items():
            start_time = slot_str.split("-")[0].strip()
            if start_time.startswith("15:10"):
                ct_slot_local = slot_idx
                break
        if ct_slot_local == -1:
            # Fallback: last usable slot (not lunch)
            usable = [idx for idx in sorted(self.time_slots) if idx != self.lunch_slot]
            ct_slot_local = usable[-1] if usable else sorted(self.time_slots)[-1]
            print(
                f"  WARNING CT-K: No 15:10 slot found in Time sheet -- "
                f"falling back to local slot {ct_slot_local} "
                f"({self.time_slots.get(ct_slot_local, '?')})"
            )
        # Store local slot index; global positions computed per day in build_model()
        self.ct_fixed_slot = ct_slot_local  # local slot index (1-based)
        print(
            f"  OK CT-K: CT local slot = {ct_slot_local} "
            f"({self.time_slots.get(ct_slot_local, '?')})  "
            f"[blocks Mon-Thu 15:10-16:50]"
        )
        # ─────────────────────────────────────────────────────────────────

        print(f"  ✓ Slots: {self.time_slots_per_day}, lunch@{self.lunch_slot}")
        print(
            f"  ✓ Theory rooms: {len(self.theory_rooms)}, "
            f"Lab rooms: {len(self.all_lab_rooms)}"
        )
        print(f"  ✓ Lab subjects in Rooms sheet: {list(self.subject_lab_rooms.keys())}")
        print(f"  ✓ Faculty rows: {len(self.faculty_df)}")
        return True

    # ──────────────────────────────────────────────────────────────
    # C10 — Lab room resolver
    # ──────────────────────────────────────────────────────────────
    def _lab_rooms_for(self, course: str, warned: set) -> list[str]:
        cl = course.lower().strip()

        target = COURSE_LAB_ABBREV_EXACT.get(cl)
        if target:
            rooms = [
                r for s, rs in self.subject_lab_rooms.items() if target in s for r in rs
            ]
            if rooms:
                return rooms

        for frag, target in COURSE_LAB_MAP.items():
            if frag in cl:
                rooms = [
                    r
                    for s, rs in self.subject_lab_rooms.items()
                    if target in s
                    for r in rs
                ]
                if rooms:
                    return rooms

        matched = []
        for subj, rooms in self.subject_lab_rooms.items():
            sl = subj.lower().replace(" lab", "").replace(" laboratory", "")
            if any(w in cl for w in sl.split() if len(w) > 3):
                matched.extend(rooms)
        if matched:
            return list(set(matched))

        if course not in warned:
            print(
                f"  ℹ  C10: '{course}' has no dedicated lab → "
                f"using all {len(self.all_lab_rooms)} lab rooms"
            )
            warned.add(course)
        return list(self.all_lab_rooms)

    # ──────────────────────────────────────────────────────────────
    # STEP 2 — Parse sessions
    # ──────────────────────────────────────────────────────────────
    def parse_sessions(self) -> bool:
        print("\n[2/6] Parsing sessions …")
        cols = {c.strip(): c for c in self.faculty_df.columns}

        def col(n):
            return cols.get(n)

        sid = 0
        cur_name = None
        th_cnt = lab_cnt = tut_cnt = 0
        warned: set[str] = set()

        for _, row in self.faculty_df.iterrows():
            nc = col("Name of Faculty")
            if nc and pd.notna(row.get(nc)):
                v = str(row[nc]).strip()
                if v and not v.upper().startswith("TOTAL"):
                    cur_name = v
            if not cur_name:
                continue

            cc = col("Course Name")
            if not cc or pd.isna(row.get(cc)):
                continue
            course = str(row[cc]).strip()
            if not course or course.upper().startswith("TOTAL"):
                continue

            th = safe_int(row.get(col("TH")))
            prtu = safe_int(row.get(col("PR/TU")))
            divs = parse_cell(row.get(col("Division")))
            bats = parse_cell(row.get(col("Batch")))

            if th > 0:
                entities = divs if divs else [None]
                per = th // len(entities)
                rem = th % len(entities)
                for i, ent in enumerate(entities):
                    n = per + (1 if i < rem else 0)
                    label = ent if ent else "—"
                    entity = ent if ent else f"_fth{sid}"
                    # ── CT-A: Skip CT sessions — CT is a reserved blocking slot ─
                    if course.strip().upper() == "CT":
                        continue  # CT-A: not scheduled; handled as a blocked slot
                    sess_rooms = list(self.theory_rooms)
                    sess_can_online = True
                    for _ in range(n):
                        self.sessions.append(
                            {
                                "id": sid,
                                "faculty": cur_name,
                                "course": course,
                                "label": label,
                                "entity": entity,
                                "etype": "division",
                                "div_family": ent,
                                "type": "Theory",
                                "duration": 1,
                                "rooms": sess_rooms,
                                "can_online": sess_can_online,
                            }
                        )
                        sid += 1
                        th_cnt += 1

            if prtu > 0:
                lab_rooms = self._lab_rooms_for(course, warned)
                if bats:
                    hrs = max(1, round(prtu / len(bats)))
                    for batch in bats:
                        h = hrs

                        # ── CT hard room constraint ───────────────────────────
                        # If this batch has a dedicated room in CT_Rooms, use
                        # ONLY that room.  This is a hard constraint: the solver
                        # must never consider any other room for this batch.
                        #
                        # NOTE: CT dedicated rooms are no longer in self.all_lab_rooms
                        # (they were removed from the generic pool in load_data to
                        # prevent non-CT sessions from competing for them).
                        # We check self.ct_dedicated_rooms instead.
                        batch_upper = batch.strip().upper()
                        if (
                            hasattr(self, "ct_room_map")
                            and batch_upper in self.ct_room_map
                        ):
                            ct_room = self.ct_room_map[batch_upper]
                            if ct_room in self.ct_dedicated_rooms:
                                batch_rooms = [ct_room]
                            else:
                                print(
                                    f"  ⚠ CT-Rooms WARNING: room '{ct_room}' for batch "
                                    f"'{batch}' was not registered — falling back to "
                                    f"generic lab rooms.  Check CT_Rooms sheet."
                                )
                                batch_rooms = lab_rooms
                        else:
                            batch_rooms = lab_rooms
                        # ─────────────────────────────────────────────────────

                        while h >= 2:
                            self.sessions.append(
                                {
                                    "id": sid,
                                    "faculty": cur_name,
                                    "course": course,
                                    "label": batch,
                                    "entity": batch,
                                    "etype": "batch",
                                    "div_family": BATCH_TO_DIVISION.get(batch),
                                    "type": "Lab",
                                    "duration": 2,
                                    "rooms": batch_rooms,
                                    "can_online": False,
                                }
                            )
                            sid += 1
                            lab_cnt += 1
                            h -= 2
                        if h == 1:
                            self.sessions.append(
                                {
                                    "id": sid,
                                    "faculty": cur_name,
                                    "course": course + " (Tutorial)",
                                    "label": batch,
                                    "entity": batch,
                                    "etype": "batch",
                                    "div_family": BATCH_TO_DIVISION.get(batch),
                                    "type": "Tutorial",
                                    "duration": 1,
                                    "rooms": list(self.theory_rooms),
                                    "can_online": True,
                                }
                            )
                            sid += 1
                            tut_cnt += 1
                else:
                    for _ in range(prtu):
                        self.sessions.append(
                            {
                                "id": sid,
                                "faculty": cur_name,
                                "course": course + " (Tutorial)",
                                "label": "—",
                                "entity": f"_ftu{sid}",
                                "etype": "batch",
                                "div_family": None,
                                "type": "Tutorial",
                                "duration": 1,
                                "rooms": list(self.theory_rooms),
                                "can_online": True,
                            }
                        )
                        sid += 1
                        tut_cnt += 1

        print(
            f"  ✓ Sessions: {len(self.sessions)}  "
            f"(Theory={th_cnt}, Lab={lab_cnt}, Tutorial={tut_cnt})"
        )
        return bool(self.sessions)

    # ──────────────────────────────────────────────────────────────
    # STEP 3 — Feasibility report
    # ──────────────────────────────────────────────────────────────
    def feasibility_report(self):
        print("\n[3/6] Feasibility pre-check …")
        n_off = sum(1 for v in self.online_days if v == 0)
        usable = self.time_slots_per_day - 1

        th_dem = sum(1 for s in self.sessions if s["type"] in ("Theory", "Tutorial"))
        lab_dem = sum(1 for s in self.sessions if s["type"] == "Lab")

        th_cap_off = len(self.theory_rooms) * usable * n_off
        th_cap_full = len(self.theory_rooms) * usable * len(self.days)
        lab_cap = len(self.all_lab_rooms) * 4 * len(self.days)

        print(f"  Theory/Tutorial demand  : {th_dem}")
        print(
            f"  Theory offline cap      : {th_cap_off}  "
            f"{'✓' if th_dem<=th_cap_off else f'⚠ overflow={th_dem-th_cap_off} → Saturday absorbs'}"
        )
        print(
            f"  Theory full cap (6 days): {th_cap_full}  "
            f"{'✓' if th_dem<=th_cap_full else '✗ OVER'}"
        )
        print(
            f"  Lab demand              : {lab_dem}  cap={lab_cap}  "
            f"{'✓' if lab_dem<=lab_cap else '✗ OVER'}"
        )

        fac: dict[str, int] = defaultdict(int)
        ent: dict[str, int] = defaultdict(int)
        for s in self.sessions:
            fac[s["faculty"]] += s["duration"]
            if not s["entity"].startswith("_"):
                ent[s["entity"]] += s["duration"]
        cap = usable * len(self.days)
        bad_f = [(f, c) for f, c in fac.items() if c > cap]
        bad_e = [(e, c) for e, c in ent.items() if c > cap]
        print(
            f"  {'✓ Faculty OK' if not bad_f else f'⚠ Overloaded faculty: {bad_f[:5]}'} "
            f"(max {cap} slots/week)"
        )
        print(
            f"  {'✓ Entities OK' if not bad_e else f'⚠ Overloaded entities: {bad_e[:5]}'}"
        )

        print("\n  Per-lab-type utilisation:")
        lab_demand_by_subject: dict[str, int] = defaultdict(int)
        for s in self.sessions:
            if s["type"] == "Lab":
                rooms = s["rooms"]
                matched_subj = "ALL (no dedicated lab)"
                for subj, srooms in self.subject_lab_rooms.items():
                    if set(rooms) == set(srooms) or set(rooms).issubset(set(srooms)):
                        matched_subj = subj
                        break
                lab_demand_by_subject[matched_subj] += 1

        for subj, dem in sorted(lab_demand_by_subject.items()):
            if subj == "ALL (no dedicated lab)":
                cap_s = len(self.all_lab_rooms) * 4 * len(self.days)
                status = "✓" if dem <= cap_s else "✗ OVER"
                print(f"    {subj}: {dem} / {cap_s} = {dem/cap_s*100:.0f}%  {status}")
            else:
                srooms = self.subject_lab_rooms.get(subj, [])
                cap_s = len(srooms) * 4 * len(self.days)
                status = "✓" if dem <= cap_s else "✗ OVER"
                print(f"    {subj}: {dem} / {cap_s} = {dem/cap_s*100:.0f}%  {status}")

        print("\n  === DETAILED LAB POOL BOTTLENECK ANALYSIS ===")
        pool_demand: dict[frozenset, list] = defaultdict(list)
        for s in self.sessions:
            if s["type"] == "Lab":
                pool_demand[frozenset(s["rooms"])].append(s["course"])

        for pool, courses in sorted(pool_demand.items(), key=lambda x: -len(x[1])):
            pool_list = sorted(pool)
            n_rooms = len(pool_list)
            n_sessions = len(courses)
            cap = n_rooms * 4 * len(self.days)
            util = n_sessions / cap * 100 if cap > 0 else float("inf")
            course_counts = Counter(courses)
            print(f"\n  Pool ({n_rooms} room(s)): {pool_list}")
            print(
                f"    Demand: {n_sessions}  Capacity: {cap}  Utilisation: {util:.0f}%"
            )
            print(f"    Courses: {dict(course_counts)}")

    # ──────────────────────────────────────────────────────────────
    # Build time domains
    # ──────────────────────────────────────────────────────────────
    def _build_time_domains(self):
        for day in range(len(self.days)):
            for slot in sorted(self.time_slots):
                g = day * self.time_slots_per_day + (slot - 1)
                self.global_to_day_slot[g] = (day, slot)
                (
                    self.online_global if self.online_days[day] else self.offline_global
                ).add(g)

        self.allowed_theory_starts = [
            g for g, (_, s) in self.global_to_day_slot.items() if s != self.lunch_slot
        ]

        preferred = [1, 3, 6, 8, 10]
        for day in range(len(self.days)):
            for s in preferred:
                s2 = s + 1
                if (
                    s in self.time_slots
                    and s2 in self.time_slots
                    and s2 <= self.time_slots_per_day
                    and s != self.lunch_slot
                    and s2 != self.lunch_slot
                ):
                    self.allowed_lab_starts.append(
                        day * self.time_slots_per_day + (s - 1)
                    )

        if not self.allowed_lab_starts:
            for g, (_, s) in self.global_to_day_slot.items():
                s2 = s + 1
                if (
                    s2 in self.time_slots
                    and s2 <= self.time_slots_per_day
                    and s != self.lunch_slot
                    and s2 != self.lunch_slot
                ):
                    self.allowed_lab_starts.append(g)

    # ──────────────────────────────────────────────────────────────
    # STEP 4 — Build CP-SAT model
    # ──────────────────────────────────────────────────────────────
    def build_model(self) -> bool:
        print("\n[4/6] Building CP-SAT model …")
        t0 = time.time()
        self._build_time_domains()

        max_g = max(self.global_to_day_slot)
        theory_dom = cp_model.Domain.FromValues(sorted(set(self.allowed_theory_starts)))
        lab_dom = cp_model.Domain.FromValues(sorted(set(self.allowed_lab_starts)))

        online_str = [self.days[i] for i, v in enumerate(self.online_days) if v]
        print(
            f"  Online days (theory/tutorial only): {', '.join(online_str) or 'None'}"
        )

        # Interval lists for NoOverlap constraints (C1–C5, C12)
        room_opt_ivls: dict[str, list] = defaultdict(list)
        faculty_ivls: dict[str, list] = defaultdict(list)
        division_ivls: dict[str, list] = defaultdict(list)
        batch_ivls: dict[str, list] = defaultdict(list)
        div_batch_ivls: dict[tuple, list] = defaultdict(list)

        # Separated start-var lists for typed decision strategies (SELECT_MIN_VALUE).
        # Labs first (most constrained), then Tutorials, then Theory.
        lab_start_vars: list[cp_model.IntVar] = []
        tutorial_start_vars: list[cp_model.IntVar] = []
        theory_start_vars: list[cp_model.IntVar] = []

        # Symmetry breaking groups
        clone_groups: dict[tuple, list[cp_model.IntVar]] = defaultdict(list)

        # Objective terms: weighted placed booleans
        objective_terms: list = []

        total_opt = 0

        for sess in self.sessions:
            sid = sess["id"]
            dur = sess["duration"]
            entity = sess["entity"]
            can_online = sess["can_online"]
            stype = sess["type"]

            start = self.model.NewIntVarFromDomain(
                lab_dom if stype == "Lab" else theory_dom, f"s{sid}_st"
            )
            end = self.model.NewIntVar(0, max_g + dur, f"s{sid}_en")

            placed = self.model.NewBoolVar(f"placed_{sid}")

            ivl = self.model.NewOptionalIntervalVar(
                start, dur, end, placed, f"s{sid}_iv"
            )

            self.session_starts[sid] = start
            self.session_ends[sid] = end
            self.session_intervals[sid] = ivl
            sess["placed_var"] = placed

            # ── Iterative-repair freeze hook ──────────────────────────────
            # If this session was scheduled in a previous repair pass, pin
            # placed=1 and start=assigned_start. This does not alter any
            # constraint — it only narrows these two vars to a single value,
            # so every existing NoOverlap / CT / objective term still applies
            # exactly as before, just with a fixed domain for frozen sessions.
            frozen = sess.get("_frozen")
            if frozen is not None:
                self.model.Add(placed == 1)
                self.model.Add(start == frozen["start"])

            if stype == "Lab":
                lab_start_vars.append(start)
            elif stype == "Tutorial":
                tutorial_start_vars.append(start)
            else:
                theory_start_vars.append(start)

            clone_key = (sess["faculty"], sess["course"], sess["entity"], stype)
            clone_groups[clone_key].append(start)

            faculty_ivls[sess["faculty"]].append(ivl)
            if sess["etype"] == "division":
                division_ivls[entity].append(ivl)
            else:
                batch_ivls[entity].append(ivl)

            div_family = sess.get("div_family")
            if div_family:
                if sess["etype"] == "division":
                    for child in DIVISION_TO_BATCHES.get(div_family, []):
                        div_batch_ivls[(div_family, child)].append(ivl)
                else:
                    div_batch_ivls[(div_family, entity)].append(ivl)

            # ── Room booleans (C2 / C10 / C11) ───────────────────────────
            room_bools: list[cp_model.BoolVar] = []
            for rname in sess["rooms"]:
                rn = re.sub(r"[^A-Za-z0-9]", "_", rname)
                bv = self.model.NewBoolVar(f"s{sid}_r{rn}")
                oi = self.model.NewOptionalIntervalVar(
                    start, dur, end, bv, f"s{sid}_i{rn}"
                )
                room_opt_ivls[rname].append(oi)
                self.session_room_bools[sid][rname] = bv
                room_bools.append(bv)
                total_opt += 1

            online_bv = self.model.NewBoolVar(f"s{sid}_ONL")
            self.session_room_bools[sid]["ONLINE"] = online_bv
            room_bools.append(online_bv)

            # C11: exactly one room iff placed
            self.model.Add(sum(room_bools) == placed)

            # ── Iterative-repair freeze hook (room) ───────────────────────
            # Pin the room boolean that was assigned in a previous pass to 1
            # and all others to 0. The C11 constraint above (exactly one
            # room iff placed) is untouched; this just fixes which boolean
            # satisfies it for frozen sessions.
            if frozen is not None:
                frozen_room = frozen["room"]
                for rname2, bv2 in self.session_room_bools[sid].items():
                    self.model.Add(bv2 == (1 if rname2 == frozen_room else 0))

            # C8/C9: online coupling
            if not can_online:
                self.model.Add(online_bv == 0).OnlyEnforceIf(placed)
                self.model.Add(online_bv == 0).OnlyEnforceIf(placed.Not())

            elif self.online_global and self.offline_global:
                online_list = sorted(
                    self.online_global & set(self.allowed_theory_starts)
                )
                offline_list = sorted(
                    self.offline_global & set(self.allowed_theory_starts)
                )

                if online_list and offline_list:
                    self.model.AddLinearExpressionInDomain(
                        start, cp_model.Domain.FromValues(online_list)
                    ).OnlyEnforceIf(online_bv)
                    self.model.AddLinearExpressionInDomain(
                        start, cp_model.Domain.FromValues(offline_list)
                    ).OnlyEnforceIf(online_bv.Not())
                    for rname, bv in self.session_room_bools[sid].items():
                        if rname != "ONLINE":
                            self.model.AddImplication(online_bv, bv.Not())
                    self.model.Add(online_bv == 0).OnlyEnforceIf(placed.Not())

                elif not online_list:
                    self.model.Add(online_bv == 0).OnlyEnforceIf(placed)
                    self.model.Add(online_bv == 0).OnlyEnforceIf(placed.Not())
                else:
                    self.model.Add(online_bv == 1).OnlyEnforceIf(placed)
                    self.model.Add(online_bv == 0).OnlyEnforceIf(placed.Not())
            else:
                self.model.Add(online_bv == 0).OnlyEnforceIf(placed)
                self.model.Add(online_bv == 0).OnlyEnforceIf(placed.Not())

            weight = SESSION_WEIGHTS.get(stype, 1)
            objective_terms.append(weight * placed)

        print(
            f"  ✓ {len(self.sessions)} optional intervals, "
            f"{total_opt} opt-room intervals"
        )

        # ══════════════════════════════════════════════════════════════
        # CT-R  —  CT reserved-slot blocking (v16, data-driven)
        # ══════════════════════════════════════════════════════════════
        #
        # DESIGN: CT allocation is now 100% data-driven via CT_MATRIX.
        # get_ct_day(division) returns the fixed day index for a division.
        # No solver variables are created for CT days.
        #
        # For each session whose owning FY division D is in CT_MATRIX:
        #   1. k = get_ct_day(D)                 ← plain integer, not a var
        #   2. ct_global = k * tspd + (ct_local_slot - 1)
        #   3. Add: start != ct_global            (blocks CT slot start)
        #   4. Add: start != ct_global - 1        (blocks lab spilling into CT)
        #      (only when dur==2 and ct_global-1 is a valid lab start)
        #
        # These are unconditional domain-restriction constraints —
        # far simpler and cheaper than the channelling BoolVars used in v15.
        # ──────────────────────────────────────────────────────────────

        _ct_local_slot = self.ct_fixed_slot  # local slot index (1-based)
        tspd = self.time_slots_per_day

        # Global CT slot positions for every day in CT_MATRIX (may span Mon-Sun)
        # Precompute once; keyed by 0-based day index.
        ct_global_per_day: dict[int, int] = {}
        for day_idx in range(len(self.days)):
            if _ct_local_slot >= 1:
                ct_global_per_day[day_idx] = day_idx * tspd + (_ct_local_slot - 1)

        # Announce the CT slots for verification
        for day_idx, g in sorted(ct_global_per_day.items()):
            if day_idx <= 3:  # only log Mon-Thu to keep output concise
                day_label = self.days[day_idx]
                slot_str = self.global_to_day_slot.get(g, (None, -1))[1]
                print(
                    f"  CT slot day {day_idx} ({day_label}): global={g}  "
                    f"local={slot_str}  ({self.time_slots.get(slot_str, '?')})"
                )

        all_valid = set(self.allowed_theory_starts) | set(self.allowed_lab_starts)
        ct_r_constraints = 0

        for sess in self.sessions:
            sid_s = sess["id"]
            start_v = self.session_starts[sid_s]
            dur_s = sess["duration"]
            placed_v = sess["placed_var"]

            # Determine which FY division owns this session
            if sess["etype"] == "division" and sess["entity"] in CT_MATRIX:
                owning_div = sess["entity"]
            elif sess.get("div_family") and sess["div_family"] in CT_MATRIX:
                owning_div = sess["div_family"]
            else:
                continue  # not linked to a CT_MATRIX division

            # get_ct_day returns the fixed day index — no solver var needed
            k = get_ct_day(owning_div)
            if k is None:
                continue

            g_ct = ct_global_per_day.get(k, -1)
            if g_ct < 0:
                continue

            # Block session from starting at CT slot (OnlyEnforceIf placed)
            if g_ct in all_valid:
                self.model.Add(start_v != g_ct).OnlyEnforceIf(placed_v)
                ct_r_constraints += 1

            # Block lab (dur=2) from starting one slot before CT
            # (a lab starting at g_ct-1 would span [g_ct-1, g_ct], overlapping CT)
            if dur_s == 2 and (g_ct - 1) in set(self.allowed_lab_starts):
                self.model.Add(start_v != (g_ct - 1)).OnlyEnforceIf(placed_v)
                ct_r_constraints += 1

        print(
            f"  OK CT-R: {ct_r_constraints} CT blocking constraints added "
            f"(static matrix — no solver CT vars)"
        )
        # ─────────────────────────────────────────────────────────────────
        sym_count = 0
        for key, svars in clone_groups.items():
            if len(svars) > 1:
                for i in range(len(svars) - 1):
                    self.model.Add(svars[i] <= svars[i + 1])
                    sym_count += 1
        print(f"  ✓ Symmetry breaking: {sym_count} ordering constraints added")

        # ── C1: Faculty no-overlap ────────────────────────────────────────
        n1 = sum(1 for v in faculty_ivls.values() if len(v) > 1)
        print(f"  C1 Faculty no-overlap: {n1} groups")
        for ivls in faculty_ivls.values():
            if len(ivls) > 1:
                self.model.AddNoOverlap(ivls)

        # ── C2: Room no-overlap ───────────────────────────────────────────
        print(f"  C2 Room no-overlap: {len(room_opt_ivls)} rooms")
        for ivls in room_opt_ivls.values():
            if len(ivls) > 1:
                self.model.AddNoOverlap(ivls)

        # ── C3: Division no-overlap ───────────────────────────────────────
        n3 = sum(1 for v in division_ivls.values() if len(v) > 1)
        print(f"  C3 Division no-overlap: {n3} divisions")
        for ivls in division_ivls.values():
            if len(ivls) > 1:
                self.model.AddNoOverlap(ivls)

        # ── C4: Batch no-overlap ──────────────────────────────────────────
        n4 = sum(1 for v in batch_ivls.values() if len(v) > 1)
        print(f"  C4 Batch no-overlap: {n4} batches")
        for ivls in batch_ivls.values():
            if len(ivls) > 1:
                self.model.AddNoOverlap(ivls)

        # ── C5/C12: Div↔Batch no-overlap ─────────────────────────────────
        n5 = sum(1 for v in div_batch_ivls.values() if len(v) > 1)
        print(f"  C5/C12 Div↔Batch no-overlap: {n5} pairs")
        for ivls in div_batch_ivls.values():
            if len(ivls) > 1:
                self.model.AddNoOverlap(ivls)

        # ── Decision strategy: SELECT_MIN_VALUE (placement-first) ────────────
        #
        # Branch on earliest slot first. Priority: Labs (most constrained, 2-slot)
        # then Tutorials, then Theory (most flexible).
        if lab_start_vars:
            self.model.AddDecisionStrategy(
                lab_start_vars,
                cp_model.CHOOSE_MIN_DOMAIN_SIZE,
                cp_model.SELECT_MIN_VALUE,
            )
        if tutorial_start_vars:
            self.model.AddDecisionStrategy(
                tutorial_start_vars,
                cp_model.CHOOSE_MIN_DOMAIN_SIZE,
                cp_model.SELECT_MIN_VALUE,
            )
        if theory_start_vars:
            self.model.AddDecisionStrategy(
                theory_start_vars,
                cp_model.CHOOSE_MIN_DOMAIN_SIZE,
                cp_model.SELECT_MIN_VALUE,
            )

        # Room bool strategy: once time is fixed, assign rooms greedily
        all_room_bools: list[cp_model.BoolVar] = []
        for sid in sorted(self.session_room_bools.keys()):
            for rname, bv in self.session_room_bools[sid].items():
                all_room_bools.append(bv)
        if all_room_bools:
            self.model.AddDecisionStrategy(
                all_room_bools,
                cp_model.CHOOSE_FIRST,
                cp_model.SELECT_MAX_VALUE,
            )

        print(
            f"  ✓ Decision strategy: Labs({len(lab_start_vars)}) → "
            f"Tutorials({len(tutorial_start_vars)}) → Theory({len(theory_start_vars)})"
            f"  [SELECT_MIN_VALUE — placement-first]"
        )

        # ══════════════════════════════════════════════════════════════
        # Day-load balancing with multi-level objective
        # ══════════════════════════════════════════════════════════════
        #
        # Objective priority hierarchy:
        #   P1: BIG_M × weighted_placed         ← maximise sessions (dominant)
        #   P2: BALANCE_WEIGHT × imbalance      ← minimise max−min day spread
        #   P3: DEV_WEIGHT × Σdev[d]            ← minimise mean-abs deviation
        #   P4: SAT_PENALTY × saturday_load     ← discourage Saturday overflow
        #
        # BIG_M = len(sessions) + 1 guarantees placing one more session always
        # outweighs any reduction in secondary/tertiary/quaternary penalties.

        n_days = len(self.days)
        BIG_M = len(self.sessions) + 1

        # Per-day slot sets: global slot indices belonging to each day
        day_slot_sets: list[list[int]] = []
        for d in range(n_days):
            day_slot_sets.append(
                sorted(
                    g for g, (gday, _) in self.global_to_day_slot.items() if gday == d
                )
            )

        # day_load[d] counts sessions placed on day d.
        # on_day[sid][d] = 1 iff placed AND start ∈ day_d_slots.
        all_start_values = sorted(
            set(self.allowed_theory_starts) | set(self.allowed_lab_starts)
        )
        all_starts_dom = cp_model.Domain.FromValues(all_start_values)

        day_load: list[cp_model.IntVar] = []
        for d in range(n_days):
            dload = self.model.NewIntVar(0, len(self.sessions), f"day_load_{d}")
            day_load.append(dload)

        for d in range(n_days):
            if not day_slot_sets[d]:
                self.model.Add(day_load[d] == 0)
                continue

            day_dom = cp_model.Domain.FromValues(day_slot_sets[d])
            not_day_dom = all_starts_dom.intersection_with(day_dom.complement())

            on_day_terms = []
            for sess in self.sessions:
                sid = sess["id"]
                placed = sess["placed_var"]
                start = self.session_starts[sid]

                on_day_bool = self.model.NewBoolVar(f"on_day_{sid}_{d}")

                # on_day → placed
                self.model.AddImplication(on_day_bool, placed)

                # on_day → start ∈ day d
                self.model.AddLinearExpressionInDomain(start, day_dom).OnlyEnforceIf(
                    on_day_bool
                )

                # placed ∧ start ∉ day d → ¬on_day
                if not_day_dom.size() > 0:
                    self.model.AddLinearExpressionInDomain(
                        start, not_day_dom
                    ).OnlyEnforceIf([on_day_bool.Not(), placed])

                on_day_terms.append(on_day_bool)

            self.model.Add(day_load[d] == sum(on_day_terms))

        # max and min day load auxiliary variables
        max_day_load = self.model.NewIntVar(0, len(self.sessions), "max_day_load")
        min_day_load = self.model.NewIntVar(0, len(self.sessions), "min_day_load")
        self.model.AddMaxEquality(max_day_load, day_load)
        self.model.AddMinEquality(min_day_load, day_load)

        # imbalance = max_day_load − min_day_load
        imbalance = self.model.NewIntVar(0, len(self.sessions), "imbalance")
        self.model.Add(imbalance == max_day_load - min_day_load)

        self._day_load_vars = day_load
        self._imbalance_var = imbalance

        # saturday_load penalised to discourage overflow onto Saturday
        saturday_idx = 5  # index in self.days ("Saturday")
        saturday_load = day_load[saturday_idx] if saturday_idx < n_days else None

        # dev[d] = |day_load[d] − avg_load| (mean-absolute deviation)
        n_total = len(self.sessions)
        avg_load = n_total // n_days  # integer floor of ideal sessions/day

        dev_vars: list[cp_model.IntVar] = []
        for d in range(n_days):
            diff = self.model.NewIntVar(-n_total, n_total, f"diff_{d}")
            self.model.Add(diff == day_load[d] - avg_load)
            dev = self.model.NewIntVar(0, n_total, f"dev_{d}")
            self.model.AddAbsEquality(dev, diff)
            dev_vars.append(dev)

        self._dev_vars = dev_vars

        # ── Combined multi-level objective (4-level) ──────────────────────
        #
        # Maximize:
        #   BIG_M × weighted_placed            [P1: placement — dominant]
        #   − BALANCE_WEIGHT × imbalance       [P2: day-load max−min spread]
        #   − DEV_WEIGHT × Σdev[d]             [P3: mean-abs day deviation]
        #   − SAT_PENALTY × saturday_load      [P4: Saturday penalty]

        weighted_placed = sum(objective_terms)

        obj = BIG_M * weighted_placed - BALANCE_WEIGHT * imbalance
        obj = obj - DEV_WEIGHT * sum(dev_vars)
        if saturday_load is not None:
            obj = obj - SAT_PENALTY * saturday_load

        self.model.Maximize(obj)

        total_weight = sum(SESSION_WEIGHTS.get(s["type"], 1) for s in self.sessions)
        sat_desc = (
            f" − {SAT_PENALTY}×saturday_load" if saturday_load is not None else ""
        )
        print(
            f"  OK Objective (v16, 4-level):\n"
            f"      Maximize  {BIG_M}xweighted_placed\n"
            f"              - {BALANCE_WEIGHT}ximbalance\n"
            f"              - {DEV_WEIGHT}xSum|day_load[d]-{avg_load}|"
            f"{sat_desc}\n"
            f"    (CT days fixed by CT_MATRIX — no CT balance term)\n"
            f"    (max_weight={total_weight * BIG_M}, "
            f"BIG_M={BIG_M}, BALANCE_WEIGHT={BALANCE_WEIGHT})"
        )
        print(f"  ✓ Model built in {time.time()-t0:.2f}s")
        return True

    # ──────────────────────────────────────────────────────────────
    # STEP 4b — Greedy warm-start hints
    # ──────────────────────────────────────────────────────────────
    def _add_solution_hints(self):
        """Greedy room/time assignment used as CP-SAT warm-start hints.

        Slots are tried in sorted (earliest-first) order, consistent with the
        SELECT_MIN_VALUE decision strategy. This maximises density of the initial
        incumbent so LNS has the best possible starting point.
        """
        lab_starts_sorted = sorted(set(self.allowed_lab_starts))
        theory_starts_sorted = sorted(set(self.allowed_theory_starts))

        slot_room_used: dict[int, set] = defaultdict(set)
        faculty_used: dict[str, set] = defaultdict(set)
        entity_used: dict[str, set] = defaultdict(set)

        def _slots_free(fac, entity, g, dur):
            for d in range(dur):
                if (g + d) in faculty_used[fac]:
                    return False
                if (g + d) in entity_used[entity]:
                    return False
            return True

        order = {"Lab": 0, "Tutorial": 1, "Theory": 2}
        sessions_sorted = sorted(
            self.sessions, key=lambda s: (order[s["type"]], s["id"])
        )

        room_total_demand: dict[str, int] = defaultdict(int)
        for sess in self.sessions:
            if sess["type"] == "Lab":
                for r in sess["rooms"]:
                    room_total_demand[r] += 1
        lab_cap_per_room = 4 * len(self.days)

        def _pool_utilisation(rooms):
            if not rooms:
                return 0.0
            total_demand = sum(room_total_demand[r] for r in rooms)
            total_cap = len(rooms) * lab_cap_per_room
            return total_demand / total_cap if total_cap > 0 else 1.0

        HINT_UTIL_THRESHOLD = 0.85
        hints_set = 0

        # ── Iterative-repair: seed occupancy from frozen sessions ─────────
        # Frozen sessions already have a fixed start/room; mark those slots
        # as used so greedy hints for the remaining flexible sessions don't
        # propose colliding placements (the solver would reject them anyway
        # via NoOverlap, but seeding keeps hints internally consistent).
        for sess in self.sessions:
            frozen = sess.get("_frozen")
            if frozen is None:
                continue
            g0 = frozen["start"]
            room0 = frozen["room"]
            dur0 = sess["duration"]
            for d in range(dur0):
                if room0 != "ONLINE":
                    slot_room_used[g0 + d].add(room0)
                faculty_used[sess["faculty"]].add(g0 + d)
                entity_used[sess["entity"]].add(g0 + d)

        for sess in sessions_sorted:
            sid = sess["id"]
            dur = sess["duration"]
            fac = sess["faculty"]
            entity = sess["entity"]
            starts = (
                lab_starts_sorted if sess["type"] == "Lab" else theory_starts_sorted
            )

            # Skip greedy hinting for already-frozen sessions — their
            # start/placed/room are pinned via hard constraints above.
            if sess.get("_frozen") is not None:
                continue

            # Skip hints for over-subscribed room pools
            if (
                sess["type"] == "Lab"
                and _pool_utilisation(sess["rooms"]) > HINT_UTIL_THRESHOLD
            ):
                continue

            placed = False
            for g in starts:
                if dur == 2:
                    day_g = g // self.time_slots_per_day
                    day_g2 = (g + 1) // self.time_slots_per_day
                    if day_g != day_g2:
                        continue
                if not _slots_free(fac, entity, g, dur):
                    continue
                chosen_room = None
                for rname in sess["rooms"]:
                    ok = all(
                        (g + d) not in slot_room_used
                        or rname not in slot_room_used[g + d]
                        for d in range(dur)
                    )
                    if ok:
                        chosen_room = rname
                        break
                if chosen_room is None:
                    continue

                self.model.AddHint(self.session_starts[sid], g)
                self.model.AddHint(sess["placed_var"], 1)
                for rname2, bv in self.session_room_bools[sid].items():
                    self.model.AddHint(bv, 1 if rname2 == chosen_room else 0)
                for d in range(dur):
                    slot_room_used[g + d].add(chosen_room)
                    faculty_used[fac].add(g + d)
                    entity_used[entity].add(g + d)
                hints_set += 1
                placed = True
                break

            if not placed:
                self.model.AddHint(sess["placed_var"], 0)
                for bv in self.session_room_bools[sid].values():
                    self.model.AddHint(bv, 0)

        print(
            f"  ✓ Warm-start hints: {hints_set}/{len(self.sessions)} sessions pre-placed"
            f"  [earliest-first slot ordering — maximise density]"
        )

    # ──────────────────────────────────────────────────────────────
    # ITERATIVE REPAIR — capture / freeze / loop
    # ──────────────────────────────────────────────────────────────
    #
    # Design summary
    # ---------------
    # Each repair pass builds a brand-new CpModel + CpSolver (CP-SAT models
    # are write-only; vars/constraints can't be removed). Sessions that were
    # successfully placed in a previous pass are marked with sess["_frozen"]
    # = {"start": g, "room": room_name}. build_model() reads this marker
    # (see the two "Iterative-repair freeze hook" blocks above) and adds
    # plain `Add(placed==1)`, `Add(start==g)`, and per-room `Add(bv==.../0)`
    # constraints — i.e. it pins the SAME variables that every existing
    # constraint (NoOverlap, CT-R, C11, objective, decision strategy) already
    # references. No constraint, objective term, or strategy is rewritten;
    # frozen sessions simply have a single-valued domain instead of a range.
    #
    # Because frozen sessions are forced placed==1 with a fixed start/room,
    # all NoOverlap / CT_MATRIX / room / faculty / division / batch
    # constraints automatically treat that slot as permanently occupied —
    # so newly-flexible (previously unscheduled) sessions can never be
    # scheduled into a frozen session's slot. This IS the freezing
    # mechanism; no separate "blocked slots" list is needed.
    # ──────────────────────────────────────────────────────────────

    def capture_solution(self) -> int:
        """Read the current solver solution and mark scheduled sessions.

        For every session with placed_var == 1, store:
            sess["_frozen"] = {"start": <int>, "room": <room name or 'ONLINE'>}

        Sessions already frozen from a prior pass keep their existing
        "_frozen" entry untouched (they are still placed==1 by construction).
        Returns the number of newly-frozen sessions in this call.
        """
        newly_frozen = 0
        for sess in self.sessions:
            if sess.get("_frozen") is not None:
                continue  # already frozen from an earlier pass
            if self.solver.Value(sess["placed_var"]) != 1:
                continue

            sid = sess["id"]
            g = self.solver.Value(self.session_starts[sid])

            room_name = next(
                (
                    rn
                    for rn, bv in self.session_room_bools[sid].items()
                    if self.solver.Value(bv)
                ),
                "ONLINE",
            )

            sess["_frozen"] = {"start": g, "room": room_name}
            newly_frozen += 1

        return newly_frozen

    def freeze_solution(self) -> None:
        """Alias / explicit entry point: capture + freeze all currently
        scheduled sessions so the next build_model() pins them.

        Kept as a separate method (per the requested clean design) even
        though capture_solution() already performs the freezing — this
        makes the iterative_repair() loop read clearly as
        'capture, then freeze, then rebuild'.
        """
        self.capture_solution()

    def _reset_solver_state(self) -> None:
        """Discard the current CpModel/CpSolver and per-session solver
        artifacts so build_model() can run again from a clean slate.

        sess["_frozen"] markers are NOT touched — they are the only state
        that carries across passes.
        """
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()

        self.session_starts = {}
        self.session_ends = {}
        self.session_intervals = {}
        self.session_room_bools = defaultdict(dict)

        self._day_load_vars = []
        self._imbalance_var = None
        self._dev_vars = []

        for sess in self.sessions:
            sess.pop("placed_var", None)

    def _scheduled_unscheduled_counts(self) -> tuple[int, int, Counter]:
        """Return (n_scheduled, n_unscheduled, type_counter_for_scheduled)."""
        scheduled = [s for s in self.sessions if s.get("_frozen") is not None]
        n_sch = len(scheduled)
        n_uns = len(self.sessions) - n_sch
        type_counts = Counter(s["type"] for s in scheduled)
        return n_sch, n_uns, type_counts

    # ──────────────────────────────────────────────────────────────
    # LNS REPAIR — select movable sessions for neighbourhood relaxation
    # ──────────────────────────────────────────────────────────────

    def _select_lns_neighbourhood(
        self,
        unscheduled_sessions: list[dict],
        freeze_ratio: float = 0.95,
    ) -> set[int]:
        """Identify a small set of SCHEDULED session IDs to unfreeze (make
        movable) for the LNS repair pass.

        Strategy (in priority order):
          1. Prefer sessions that share the same FACULTY as an unscheduled
             session — releasing them may free a time slot the solver needs.
          2. Then prefer sessions that share the same DIVISION/ENTITY.
          3. Then prefer sessions that share the same ROOM POOL
             (overlapping rooms list).
          4. Then prefer sessions on the same DAY as an unscheduled session
             (if its frozen["start"] maps to a day on which unscheduled
             sessions are most concentrated).

        The number of sessions to unfreeze is:
            n_movable = max(1, round((1 - freeze_ratio) * n_frozen))
        so with freeze_ratio=0.95 and 848 frozen sessions ≈ 42 become movable.

        Returns a set of session IDs that should have their "_frozen" marker
        temporarily removed before build_model() is called.
        """
        import random

        # All currently frozen sessions
        frozen_sessions = [s for s in self.sessions if s.get("_frozen") is not None]
        n_frozen = len(frozen_sessions)
        if n_frozen == 0 or not unscheduled_sessions:
            return set()

        n_movable = max(1, round((1.0 - freeze_ratio) * n_frozen))

        # ── Build lookup sets from unscheduled sessions ───────────────────
        uns_faculties: set[str] = {s["faculty"] for s in unscheduled_sessions}
        uns_entities: set[str] = {s["entity"] for s in unscheduled_sessions}
        uns_div_families: set[str] = {
            s["div_family"] for s in unscheduled_sessions if s.get("div_family")
        }
        uns_room_sets: list[set[str]] = [set(s["rooms"]) for s in unscheduled_sessions]

        # Days on which unscheduled sessions would most benefit from relief:
        # count how many frozen sessions sit on each day and compare with
        # which days carry unscheduled sessions' closest relatives.
        uns_days: set[int] = set()
        for s in unscheduled_sessions:
            # Use the entity's frozen siblings' days as a proxy
            for fs in frozen_sessions:
                if fs["faculty"] == s["faculty"] or fs["entity"] == s["entity"]:
                    fz = fs.get("_frozen", {})
                    g = fz.get("start")
                    if g is not None and g in self.global_to_day_slot:
                        d, _ = self.global_to_day_slot[g]
                        uns_days.add(d)

        # ── Score each frozen session ─────────────────────────────────────
        # Higher score → more beneficial to unfreeze for this neighbourhood.
        scored: list[tuple[float, int, dict]] = []

        for fs in frozen_sessions:
            score = 0.0
            fz = fs.get("_frozen", {})
            g = fz.get("start")
            fs_day = (
                self.global_to_day_slot[g][0]
                if (g is not None and g in self.global_to_day_slot)
                else -1
            )

            # Priority 1: same faculty as an unscheduled session (+4 pts)
            if fs["faculty"] in uns_faculties:
                score += 4.0

            # Priority 2: same entity/division family (+3 pts)
            if fs["entity"] in uns_entities:
                score += 3.0
            if fs.get("div_family") in uns_div_families:
                score += 2.0

            # Priority 3: overlapping room pool (+2 pts, scaled by overlap)
            fs_rooms = set(fs["rooms"])
            for ur in uns_room_sets:
                overlap = len(fs_rooms & ur)
                if overlap > 0:
                    score += 2.0 * (overlap / max(len(fs_rooms), len(ur)))
                    break  # count once per frozen session

            # Priority 4: on a day relevant to unscheduled sessions (+1 pt)
            if fs_day in uns_days:
                score += 1.0

            # Tiny random tiebreak so repeated calls explore different neighbours
            score += random.uniform(0.0, 0.1)

            scored.append((score, fs["id"], fs))

        # Sort descending by score; take the top n_movable
        scored.sort(key=lambda x: -x[0])
        movable_ids = {sid for _, sid, _ in scored[:n_movable]}

        # ── Diagnostics ───────────────────────────────────────────────────
        top_reasons: list[str] = []
        for _, sid, fs in scored[: min(5, n_movable)]:
            reasons = []
            if fs["faculty"] in uns_faculties:
                reasons.append("faculty-match")
            if fs["entity"] in uns_entities:
                reasons.append("entity-match")
            if fs.get("div_family") in uns_div_families:
                reasons.append("div-family-match")
            fs_rooms = set(fs["rooms"])
            if any(fs_rooms & ur for ur in uns_room_sets):
                reasons.append("room-pool-overlap")
            fz = fs.get("_frozen", {})
            g = fz.get("start")
            fs_day = (
                self.global_to_day_slot[g][0]
                if (g is not None and g in self.global_to_day_slot)
                else -1
            )
            if fs_day in uns_days:
                reasons.append("same-day")
            top_reasons.append(
                f"    sid={sid:4d}  {fs['type']:<9}  {fs['faculty']:<28} "
                f"{fs['course'][:30]:<30}  [{', '.join(reasons) or 'tiebreak'}]"
            )

        print(
            f"\n  LNS neighbourhood: {n_movable} of {n_frozen} frozen sessions "
            f"unfrozen  (freeze_ratio={freeze_ratio:.0%})"
        )
        print(f"  Criteria: faculty-match, entity-match, room-pool-overlap, same-day")
        if top_reasons:
            print(f"  Top movable sessions (showing up to 5):")
            for r in top_reasons:
                print(r)

        return movable_ids

    def _apply_lns_unfreeze(self, movable_ids: set[int]) -> list[dict]:
        """Temporarily remove the '_frozen' marker from sessions in
        *movable_ids*.  Returns the list of (session, saved_frozen_value)
        tuples so the caller can restore them if needed.

        After calling this, build_model() will treat those sessions as
        unscheduled (flexible), allowing the solver to reshuffle them.
        """
        saved: list[tuple[dict, dict]] = []
        for sess in self.sessions:
            if sess["id"] in movable_ids and sess.get("_frozen") is not None:
                saved.append((sess, sess["_frozen"]))
                del sess["_frozen"]
        return saved  # type: ignore[return-value]

    def _restore_lns_freeze(self, saved: list) -> None:
        """Restore '_frozen' markers that were temporarily removed by
        _apply_lns_unfreeze().  Called if the LNS pass fails to improve.
        """
        for sess, frozen_val in saved:
            if sess.get("_frozen") is None:
                sess["_frozen"] = frozen_val

    # ──────────────────────────────────────────────────────────────
    # ITERATIVE REPAIR — print pass header table row
    # ──────────────────────────────────────────────────────────────

    @staticmethod
    def _print_repair_row(
        iteration: int,
        n_sch: int,
        n_uns: int,
        improvement: int | None,
        remaining_ids: list[int],
    ) -> None:
        """Print one diagnostic row for the iterative repair loop.

        Format:
          Iter  Scheduled  Unscheduled  Improvement  Remaining IDs
        """
        impr_str = f"+{improvement}" if improvement is not None else "—"
        ids_str = str(remaining_ids) if remaining_ids else "[]"
        print(
            f"\n  {'─'*85}"
            f"\n  Iter {iteration:>2}  |  Scheduled: {n_sch:>4}  |  "
            f"Unscheduled: {n_uns:>3}  |  "
            f"Improvement: {impr_str:>4}  |  "
            f"Remaining IDs: {ids_str}"
            f"\n  {'─'*85}"
        )

    def iterative_repair(
        self,
        max_iterations: int = 5,
        time_limit: int = 600,
        use_hints: bool = True,
        lns_freeze_ratio: float = 0.95,
        lns_start_pass: int = 3,
    ) -> bool:
        """Run the existing solve() repeatedly, freezing scheduled sessions
        between passes so only unscheduled sessions remain flexible.

        Pass 1  — normal, unmodified solve() over every session.
        Pass 2  — freeze all scheduled sessions; try to place the remaining.
        Pass 3+ — LNS repair: freeze 95% of scheduled sessions, unfreeze a
                  targeted 5% neighbourhood (same faculty / entity / room pool /
                  day as unscheduled sessions), rebuild and reoptimize.

        Stops when:
          • An iteration adds 0 newly-scheduled sessions, OR
          • All sessions are scheduled, OR
          • max_iterations is reached.

        Returns True if at least Pass 1 solved successfully.

        Parameters
        ----------
        lns_freeze_ratio : float
            Fraction of scheduled sessions to keep frozen during LNS passes
            (default 0.95 → release ≈5%).
        lns_start_pass : int
            Which iteration number to begin applying LNS neighbourhood
            relaxation (default 3; passes 1 and 2 use the original strategy).
        """
        initial_scheduled: int | None = None
        prev_scheduled = 0
        success_any = False

        # Print table header
        print("\n" + "=" * 85)
        print(
            f"  {'Iter':>4}  {'Scheduled':>10}  {'Unscheduled':>12}  "
            f"{'Improvement':>12}  Remaining Unscheduled IDs"
        )
        print("=" * 85)

        for iteration in range(1, max_iterations + 1):
            print("\n" + "#" * 70)
            print(f"  ITERATIVE REPAIR — Pass {iteration}/{max_iterations}")
            if iteration >= lns_start_pass:
                print(
                    f"  [LNS mode: freeze {lns_freeze_ratio:.0%} of scheduled, "
                    f"relax ≈{(1-lns_freeze_ratio):.0%} neighbourhood]"
                )
            print("#" * 70)

            lns_saved: list = []  # holds (sess, frozen_val) pairs for rollback

            if iteration > 1:
                # Always capture the latest solution first
                self.capture_solution()

                # ── LNS neighbourhood relaxation (Pass 3+) ────────────────
                if iteration >= lns_start_pass:
                    unscheduled_now = [
                        s for s in self.sessions if s.get("_frozen") is None
                    ]
                    if unscheduled_now:
                        movable_ids = self._select_lns_neighbourhood(
                            unscheduled_sessions=unscheduled_now,
                            freeze_ratio=lns_freeze_ratio,
                        )
                        lns_saved = self._apply_lns_unfreeze(movable_ids)
                        print(f"  → {len(lns_saved)} sessions unfrozen for LNS pass.")
                    else:
                        print("  → All sessions already scheduled; nothing to repair.")

                self._reset_solver_state()
                if not self.build_model():
                    print("  ✗ build_model() failed during repair — stopping.")
                    # Restore any LNS unfreezes before exiting
                    self._restore_lns_freeze(lns_saved)
                    break

            ok = self.solve(time_limit=time_limit, use_hints=use_hints)

            if not ok:
                # LNS pass failed: restore unfrozen sessions so we don't lose
                # previously scheduled work.
                if lns_saved:
                    print(
                        "  ⚠ LNS pass did not produce a solution — "
                        "restoring unfrozen sessions."
                    )
                    self._restore_lns_freeze(lns_saved)
                if iteration == 1:
                    return False
                print(f"  ✗ Pass {iteration} did not solve — stopping repair.")
                break

            success_any = True

            # capture_solution() is called here so the final pass is also
            # reflected in counts even if max_iterations is reached.
            self.capture_solution()
            n_sch, n_uns, type_counts = self._scheduled_unscheduled_counts()

            # IDs of sessions that are still unscheduled after this pass
            remaining_ids = [s["id"] for s in self.sessions if s.get("_frozen") is None]

            improvement: int | None = None
            if initial_scheduled is None:
                initial_scheduled = n_sch
            else:
                improvement = n_sch - prev_scheduled

            # ── Per-iteration diagnostic table row ────────────────────────
            self._print_repair_row(iteration, n_sch, n_uns, improvement, remaining_ids)

            print(f"\n  Scheduled Labs      = {type_counts.get('Lab', 0)}")
            print(f"  Scheduled Tutorials = {type_counts.get('Tutorial', 0)}")
            print(f"  Scheduled Theory    = {type_counts.get('Theory', 0)}")

            if n_uns == 0:
                print("\n  ✓ All sessions scheduled — stopping repair early.")
                prev_scheduled = n_sch
                break

            if improvement is not None and improvement <= 0:
                print(
                    f"\n  No improvement in Pass {iteration} "
                    f"({n_sch} == {prev_scheduled}) — stopping repair."
                )
                prev_scheduled = n_sch
                break

            prev_scheduled = n_sch

        final_scheduled = prev_scheduled
        print("\n" + "=" * 70)
        print("  ITERATIVE REPAIR — SUMMARY")
        print("=" * 70)
        print(f"  Initial scheduled count : {initial_scheduled}")
        print(f"  Final scheduled count   : {final_scheduled}")
        print(
            f"  Total improvement       : "
            f"+{final_scheduled - initial_scheduled if initial_scheduled is not None else 0}"
        )
        remaining_final = [s["id"] for s in self.sessions if s.get("_frozen") is None]
        if remaining_final:
            print(f"  Remaining unscheduled   : {len(remaining_final)} sessions")
            print(f"  Remaining IDs           : {remaining_final}")
            for s in self.sessions:
                if s.get("_frozen") is None:
                    print(
                        f"    sid={s['id']:4d}  {s['type']:<9}  "
                        f"{s['faculty']:<28}  {s['course']}"
                    )
        else:
            print("  ✓ All sessions scheduled!")
        print("=" * 70)

        return success_any

    # ──────────────────────────────────────────────────────────────
    # STEP 5 — Solve
    # ──────────────────────────────────────────────────────────────
    def solve(self, time_limit: int = 600, use_hints: bool = True) -> bool:
        print(f"\n[5/6] Solving (limit: {time_limit}s) …")

        if use_hints:
            print("  Building solution hints …")
            self._add_solution_hints()

        self.solver.parameters.max_time_in_seconds = time_limit
        self.solver.parameters.log_search_progress = True
        self.solver.parameters.random_seed = 42
        self.solver.parameters.cp_model_presolve = True
        self.solver.parameters.num_search_workers = 8
        self.solver.parameters.linearization_level = 1
        self.solver.parameters.cp_model_probing_level = 0
        self.solver.parameters.interleave_search = True
        self.solver.parameters.share_binary_clauses = True
        self.solver.parameters.diversify_lns_params = True
        self.solver.parameters.use_lns_only = False
        self.solver.parameters.shared_tree_num_workers = 2

        t0 = time.time()
        status = self.solver.Solve(self.model)
        elapsed = time.time() - t0

        print(f"\n  Solved in {elapsed:.1f}s  |  {self.solver.StatusName(status)}")
        print("\n===== Solver Statistics =====")
        print(f"Branches : {self.solver.NumBranches()}")
        print(f"Conflicts: {self.solver.NumConflicts()}")
        print(f"Wall time: {self.solver.WallTime():.2f}s")
        print("=" * 29)

        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            self._print_diagnostic_report()
            return True

        if status == cp_model.INFEASIBLE:
            print("  ✗ INFEASIBLE — even the relaxed (optional-session) model")
            print("    has no solution. This should not happen; check room/time data.")
        else:
            print("  ✗ UNKNOWN — no solution within time limit.")
            print(f"    → Try: --time-limit {time_limit * 2}")
            print("    → Or:  reduce --workers to match your CPU core count")
        return False

    # ──────────────────────────────────────────────────────────────
    # Diagnostic report — printed after solve
    # ──────────────────────────────────────────────────────────────
    def _print_diagnostic_report(self):
        scheduled = [
            s for s in self.sessions if self.solver.Value(s["placed_var"]) == 1
        ]
        unscheduled = [
            s for s in self.sessions if self.solver.Value(s["placed_var"]) == 0
        ]

        total = len(self.sessions)
        n_sch = len(scheduled)
        n_uns = len(unscheduled)

        print("\n" + "=" * 70)
        print(f"  SCHEDULED   : {n_sch:4d} / {total}  ({n_sch/total*100:.1f}%)")
        print(f"  UNSCHEDULED : {n_uns:4d} / {total}  ({n_uns/total*100:.1f}%)")
        print("=" * 70)

        # ── CT-S: CT Allocation Report (console) — reads CT_MATRIX directly ──
        self._print_ct_allocation()
        # ─────────────────────────────────────────────────────────────────

        # ── Day-load distribution ─────────────────────────────────────────
        if self._day_load_vars:
            print("\n  Sessions per day:")
            loads = [self.solver.Value(v) for v in self._day_load_vars]
            max_l = max(loads) if loads else 1
            bar_scale = 40 / max(max_l, 1)
            for day_name, load in zip(self.days, loads):
                bar = "█" * int(load * bar_scale)
                print(f"    {day_name:<12} {load:4d}  {bar}")
            if self._imbalance_var is not None:
                imb = self.solver.Value(self._imbalance_var)
                ideal = n_sch / len(self.days) if self.days else 0
                print(
                    f"\n    Imbalance (max−min): {imb}  |  Ideal per day: {ideal:.1f}"
                )
            if self._dev_vars:
                total_dev = sum(self.solver.Value(v) for v in self._dev_vars)
                print(f"    Total deviation from avg: {total_dev}")
            print()

        if not unscheduled:
            print("  ✓ All sessions scheduled — complete timetable generated.")
            return

        # ── By session type ───────────────────────────────────────────────
        type_counts = Counter(s["type"] for s in unscheduled)
        print("\n  Unscheduled by type:")
        for t in ["Lab", "Tutorial", "Theory"]:
            if type_counts[t]:
                print(f"    {t:<10}: {type_counts[t]:4d}")

        # ── By faculty ────────────────────────────────────────────────────
        fac_counts = Counter(s["faculty"] for s in unscheduled)
        print(f"\n  Unscheduled by faculty ({len(fac_counts)} affected):")
        for fac, cnt in sorted(fac_counts.items(), key=lambda x: -x[1]):
            total_fac = sum(1 for s in self.sessions if s["faculty"] == fac)
            print(f"    {cnt:3d}/{total_fac:<3d}  {fac}")

        # ── By course / subject ───────────────────────────────────────────
        course_counts = Counter(s["course"] for s in unscheduled)
        print(f"\n  Unscheduled by course ({len(course_counts)} affected):")
        for course, cnt in sorted(course_counts.items(), key=lambda x: -x[1]):
            print(f"    {cnt:3d}  {course}")

        # ── By division / batch ───────────────────────────────────────────
        entity_counts = Counter(s["label"] for s in unscheduled)
        print(f"\n  Unscheduled by division/batch ({len(entity_counts)} affected):")
        for ent, cnt in sorted(entity_counts.items(), key=lambda x: (-x[1], x[0])):
            print(f"    {cnt:3d}  {ent}")

        # ── Full table ────────────────────────────────────────────────────
        print(f"\n  {'─'*118}")
        print(f"  {'Faculty':<30} {'Course':<40} {'Label':<12} {'Type':<10}")
        print(f"  {'─'*30} {'─'*40} {'─'*12} {'─'*10}")
        for s in sorted(
            unscheduled, key=lambda x: (x["type"], x["faculty"], x["course"])
        ):
            print(
                f"  {s['faculty']:<30} {s['course']:<40} "
                f"{s['label']:<12} {s['type']:<10}"
            )
        print(f"  {'─'*118}")

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

    # ──────────────────────────────────────────────────────────────
    # STEP 6 — Extract & save
    # ──────────────────────────────────────────────────────────────
    def extract_solution(self) -> list[dict]:
        print("\n[6/6] Extracting …")
        rows = []
        for sess in self.sessions:
            if self.solver.Value(sess["placed_var"]) == 0:
                continue
            sid = sess["id"]
            dur = sess["duration"]
            g = self.solver.Value(self.session_starts[sid])
            day, slot = self.global_to_day_slot[g]

            t1 = self.time_slots[slot].split("-")[0].strip()
            if dur == 2 and (slot + 1) in self.time_slots:
                t2 = self.time_slots[slot + 1].split("-")[1].strip()
            else:
                t2 = self.time_slots[slot].split("-")[1].strip()
                if dur == 2:
                    print(
                        f"  ⚠ WARNING: lab s{sid} at slot {slot} "
                        f"— slot {slot+1} missing"
                    )
            time_str = f"{t1}–{t2}"

            room = next(
                (
                    rn
                    for rn, bv in self.session_room_bools[sid].items()
                    if self.solver.Value(bv)
                ),
                "UNASSIGNED",
            )

            rows.append(
                {
                    "Day": self.days[day],
                    "Time": time_str,
                    "Faculty": sess["faculty"],
                    "Course": sess["course"],
                    "Div/Batch": sess["label"],
                    "Type": sess["type"],
                    "Room": room,
                    "_day": day,
                    "_slot": slot,
                }
            )

        rows.sort(key=lambda r: (r["_day"], r["_slot"], r["Div/Batch"]))
        for r in rows:
            del r["_day"], r["_slot"]
        print(f"  ✓ {len(rows)} sessions placed")
        return rows

    def save_timetable(self, solution: list[dict], out: str):
        unscheduled = [
            s for s in self.sessions if self.solver.Value(s["placed_var"]) == 0
        ]
        unscheduled_rows = [
            {
                "Faculty": s["faculty"],
                "Course": s["course"],
                "Div/Batch": s["label"],
                "Type": s["type"],
                "Entity": s["entity"],
            }
            for s in sorted(
                unscheduled, key=lambda x: (x["type"], x["faculty"], x["course"])
            )
        ]

        print(f"\nSaving → {out}")
        df = pd.DataFrame(solution)
        if df.empty:
            print("  ✗ Nothing to save in main timetable.")
            if unscheduled_rows:
                df_uns = pd.DataFrame(unscheduled_rows)
                with pd.ExcelWriter(out, engine="openpyxl") as w:
                    df_uns.to_excel(w, sheet_name="Unscheduled", index=False)
                print(
                    f"  ✓ Unscheduled report saved ({len(unscheduled_rows)} sessions)."
                )
            return

        day_ord = {d: i for i, d in enumerate(self.days)}

        def srt(sub):
            s = sub.copy()
            s["_o"] = s["Day"].map(day_ord)
            return s.sort_values(["_o", "Time"]).drop(columns=["_o"])

        # ── Build CT Allocation DataFrame directly from CT_MATRIX ────────
        ct_batches_by_day = _build_ct_batches_by_day()

        ct_rows = []
        for day_idx in sorted(self.ct_allocation.keys()):
            day_name = (
                self.days[day_idx] if day_idx < len(self.days) else f"Day{day_idx}"
            )
            for div in self.ct_allocation.get(day_idx, []):
                ct_rows.append(
                    {
                        "CT Day": day_name,
                        "Day Index": day_idx,
                        "Division": div,
                        "Active CT Batches": "  ".join(
                            ct_batches_by_day.get(day_idx, [])
                        ),
                    }
                )
        df_ct = (
            pd.DataFrame(ct_rows)
            if ct_rows
            else pd.DataFrame(
                columns=["CT Day", "Day Index", "Division", "Active CT Batches"]
            )
        )

        with pd.ExcelWriter(out, engine="openpyxl") as w:
            df.to_excel(w, sheet_name="Overview", index=False)
            df_ct.to_excel(w, sheet_name="CT Allocation", index=False)

            if unscheduled_rows:
                pd.DataFrame(unscheduled_rows).to_excel(
                    w, sheet_name="Unscheduled", index=False
                )

            for fac in sorted(df["Faculty"].unique()):
                srt(df[df["Faculty"] == fac]).to_excel(
                    w, sheet_name=f"F_{fac}"[:31], index=False
                )

            for lbl in sorted(l for l in df["Div/Batch"].unique() if l != "—"):
                safe_lbl = re.sub(r"[\\/*?:\[\]]", "_", lbl)
                srt(df[df["Div/Batch"] == lbl]).to_excel(
                    w, sheet_name=f"E_{safe_lbl}"[:31], index=False
                )

            for room in sorted(df["Room"].unique()):
                srt(df[df["Room"] == room]).to_excel(
                    w, sheet_name=f"R_{room}"[:31], index=False
                )

        n = (
            1  # Overview
            + 1  # CT Allocation (CT-S)
            + (1 if unscheduled_rows else 0)
            + df["Faculty"].nunique()
            + df["Div/Batch"].nunique()
            + df["Room"].nunique()
        )
        print(
            f"  ✓ {n} sheets saved  "
            f"({len(unscheduled_rows)} unscheduled sessions in 'Unscheduled' sheet)"
        )
        print("\n" + "─" * 95)
        print(df.head(30).to_string(index=False))
        if len(df) > 30:
            print(f"  … {len(df)-30} more rows")


# ══════════════════════════════════════════════════════════════════════
def main():
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--time-limit",
        type=int,
        default=600,
        help="Solver time limit in seconds (default: 600)",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=8,
        help="Number of parallel CP-SAT workers (default: 8)",
    )
    parser.add_argument(
        "--no-hints",
        action="store_true",
        help="Disable greedy warm-start hints (for debugging)",
    )
    parser.add_argument(
        "--input",
        default="FY.xlsx",
        help="Input Excel file (default: FY.xlsx)",
    )
    parser.add_argument(
        "--output",
        default="FY_TT.xlsx",
        help="Output Excel file (default: FY_TT.xlsx)",
    )
    parser.add_argument(
        "--max-iterations",
        type=int,
        default=5,
        help="Maximum iterative-repair passes (default: 5)",
    )
    parser.add_argument(
        "--lns-freeze-ratio",
        type=float,
        default=0.95,
        help="Fraction of scheduled sessions frozen during LNS passes "
        "(default: 0.95 → keep 95%%, relax 5%%)",
    )
    parser.add_argument(
        "--lns-start-pass",
        type=int,
        default=3,
        help="Which pass number to begin LNS neighbourhood relaxation "
        "(default: 3; passes 1-2 use the original full-freeze strategy)",
    )
    args = parser.parse_args()

    s = TimetableScheduler()
    s.online_days = [0, 0, 0, 0, 0, 1]

    if not s.load_data(args.input):
        return
    if not s.parse_sessions():
        return
    s.feasibility_report()
    if not s.build_model():
        return

    s.solver.parameters.num_search_workers = args.workers

    use_hints = not args.no_hints
    if s.iterative_repair(
        max_iterations=args.max_iterations,
        time_limit=args.time_limit,
        use_hints=use_hints,
        lns_freeze_ratio=args.lns_freeze_ratio,
        lns_start_pass=args.lns_start_pass,
    ):
        sol = s.extract_solution()
        s.save_timetable(sol, args.output)
        print("\n" + "=" * 70)
        print(f"  SUCCESS — {args.output} generated")
        print("=" * 70)
    else:
        print("\nFailed. Check feasibility report above.")


def generate_timetable(excel_path: str, output_path: str = None) -> dict:
    """
    Flask entry point for the timetable generator.

    Mirrors the exact sequence used in main() so all solver
    configuration, iterative repair, and LNS passes are applied.

    Returns a dict with:
      success       : bool
      scheduled     : int   — sessions placed
      total         : int   — sessions attempted
      rows          : list  — timetable rows (Overview sheet format)
      unscheduled   : list  — sessions that could not be placed
      error         : str   — only present on failure
    """
    import os

    s = TimetableScheduler()
    s.online_days = [0, 0, 0, 0, 0, 1]  # Saturday = online, matches main()

    if not s.load_data(excel_path):
        return {
            "success": False,
            "error": "Failed to load Excel data. Check sheet names: Faculty, Rooms, Time.",
        }

    if not s.parse_sessions():
        return {
            "success": False,
            "error": "Failed to parse sessions from Faculty sheet.",
        }

    s.feasibility_report()

    if not s.build_model():
        return {"success": False, "error": "Failed to build CP-SAT model."}

    # Match the worker count used in main() (8 is the default)
    s.solver.parameters.num_search_workers = 8

    # Run iterative repair — this is the correct entry point, NOT solver.Solve()
    solved = s.iterative_repair(
        max_iterations=5,
        time_limit=300,  # 5 min cap per pass; keeps Flask request alive
        use_hints=True,
        lns_freeze_ratio=0.95,
        lns_start_pass=3,
    )

    if not solved:
        return {
            "success": False,
            "error": "Solver could not find a feasible solution. Check feasibility report output.",
        }

    # Extract the placed sessions as a list of row dicts
    solution = s.extract_solution()

    # Optionally write the Excel file (used for download endpoint)
    if output_path:
        s.save_timetable(solution, output_path)

    # Build unscheduled list for the response
    unscheduled = [
        {
            "faculty": sess["faculty"],
            "course": sess["course"],
            "label": sess["label"],
            "type": sess["type"],
        }
        for sess in s.sessions
        if s.solver.Value(sess["placed_var"]) == 0
    ]

    return {
        "success": True,
        "scheduled": len(solution),
        "total": len(s.sessions),
        "rows": solution,  # list of dicts: Day, Time, Faculty, Course, ...
        "unscheduled": unscheduled,
    }


if __name__ == "__main__":
    main()
