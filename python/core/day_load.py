"""Day-load balancing: day_load[d] counters, max−min imbalance, and
mean-absolute deviation — the P2/P3 terms of the multi-level objective.

Also collects the per-lecture Saturday penalty terms (P7), since they are
derived from the same on_day_bool variables built here.

self._on_day_bool[d][sid] (placed AND starts on day d) is stored on the
instance so schedulers/compactness/ and the theory course-spread rule can
reuse it directly instead of re-deriving day membership from scratch.
"""

from ortools.sat.python import cp_model

from ..config import SAT_LECTURE_PENALTY


class DayLoadMixin:
    def _build_day_load_balance(self) -> dict:
        n_days = len(self.days)

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

        # Per-lecture Saturday penalty terms (ported from final.py)
        saturday_idx = 5  # index in self.days ("Saturday") — hoisted here
        sat_lecture_penalty_terms: list = []

        self._on_day_bool = {d: {} for d in range(n_days)}

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
                self._on_day_bool[d][sid] = on_day_bool

                # Medium per-lecture penalty for any session on Saturday.
                # on_day_bool is already 1 iff placed AND starts on day d —
                # no new variable required.
                if d == saturday_idx:
                    sat_lecture_penalty_terms.append(SAT_LECTURE_PENALTY * on_day_bool)

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

        return {
            "day_load": day_load,
            "imbalance": imbalance,
            "dev_vars": dev_vars,
            "saturday_load": saturday_load,
            "avg_load": avg_load,
            "sat_lecture_penalty_terms": sat_lecture_penalty_terms,
        }
