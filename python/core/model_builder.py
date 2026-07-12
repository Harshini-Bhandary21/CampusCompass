"""STEP 4 — build_model(): assembles the full CP-SAT model from the
smaller, focused steps in session_variables.py / constraints.py /
day_load.py / objective.py.
"""

import time

from ortools.sat.python import cp_model

from .constraints import ConstraintsMixin
from .day_load import DayLoadMixin
from .objective import ObjectiveMixin
from .session_variables import SessionVariablesMixin


class ModelBuilderMixin(
    SessionVariablesMixin, ConstraintsMixin, DayLoadMixin, ObjectiveMixin
):
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

        # CT-P: Pre-compute CT global slot positions before session loop
        # (see schedulers/ct/model_pins.py — needed inside the loop to pin
        # CT batch sessions to their fixed 15:10 slot).
        ct_global_per_day = self._build_ct_pin_slots()

        state = self._create_session_variables(
            theory_dom, lab_dom, max_g, ct_global_per_day
        )

        # CT-R: block every other session of a CT-day division from the
        # 15:10/16:00 CT slots — see schedulers/ct/model_pins.py.
        self._apply_ct_blocking()

        self._add_symmetry_breaking(state["clone_groups"])
        self._add_no_overlap_constraints(state)
        self._add_decision_strategies(state)

        # ══════════════════════════════════════════════════════════════
        # Day-load balancing + multi-level objective
        # ══════════════════════════════════════════════════════════════
        day_load_state = self._build_day_load_balance()

        # Theory-only soft constraints (ported from final.py)
        theory_penalty_terms = self._add_theory_soft_constraints()

        self._build_objective(state, day_load_state, theory_penalty_terms)

        print(f"  ✓ Model built in {time.time()-t0:.2f}s")
        return True
