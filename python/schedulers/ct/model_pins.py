"""Pinning CT batch sessions to their fixed slot inside the CP-SAT model,
and blocking all OTHER sessions of a CT-day division from that slot.
"""

import re

from ...config import CT_MATRIX
from .matrix_lookup import get_ct_day


class CTModelPinsMixin:
    """CT model-building instance methods, mixed into CTMixin."""

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
        start,
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
