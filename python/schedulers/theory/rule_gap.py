"""Rules (6)/(7): faculty/entity gap minimisation — penalise idle theory
slots sandwiched between two occupied theory slots on the same day, for a
given faculty or division/batch.

An earlier version of this computed the gap as (last_occupied − first_occupied)
− occupied_duration using AddMinEquality/AddMaxEquality over sentinel-masked
"effective start/end" IntVars spanning ALL session types. That measurably
stalled the solver — big-domain sentinel values feeding Min/Max/subtraction
constraints propagate very poorly in CP-SAT (a real solve that completed in
under a minute without it made zero branching progress in 150s with it).

This version reuses the existing per-slot occupancy booleans (occ / occ_fac
from setup.py, already proven fast — they're the same booleans the other
theory rules use) and computes gaps with plain boolean prefix/suffix OR
chains: slot i is a gap iff it is empty AND something is occupied strictly
before it AND something is occupied strictly after it, on the same day.
Lunch is never in the slot list (allowed_theory_starts already excludes it),
so a lunch break is correctly never counted as a gap.

Scope note: restricted to Theory sessions (like every other rule in this
package) — a faculty/entity whose sessions are all Lab/Tutorial gets no gap
check. Labs already sit in fixed preferred slot pairs, so this is where the
"awkward free period" complaint actually comes from in practice.
"""

from ...config import ENTITY_GAP_PENALTY, FACULTY_GAP_PENALTY


class TheoryRuleGapMixin:
    def _theory_rule_entity_gap(self, helpers, penalty_terms) -> int:
        return self._gap_count_for_groups(
            helpers["entity_sessions"], helpers["occ"], "entgap",
            ENTITY_GAP_PENALTY, penalty_terms,
        )

    def _theory_rule_faculty_gap(self, helpers, penalty_terms) -> int:
        return self._gap_count_for_groups(
            helpers["faculty_sessions"], helpers["occ_fac"], "facgap",
            FACULTY_GAP_PENALTY, penalty_terms,
        )

    def _theory_day_occupancy(self, group_key, day, occ_dict) -> list:
        tspd = self.time_slots_per_day
        day_globals = sorted(
            g for g in self.allowed_theory_starts if g // tspd == day
        )
        return [occ_dict[(group_key, g)] for g in day_globals]

    def _gap_count_for_groups(
        self, groups, occ_dict, tag_prefix, weight, penalty_terms
    ) -> int:
        n = 0
        for group_key, sess_list in groups.items():
            if len(sess_list) < 2:
                continue  # can't have an internal gap with 0-1 sessions total
            for day in range(len(self.days)):
                occ_list = self._theory_day_occupancy(group_key, day, occ_dict)
                k = len(occ_list)
                if k < 3:
                    continue  # need an interior slot for a gap to exist

                tag = f"{tag_prefix}_{group_key}_{day}"

                # prefix_any[i] = OR(occ_list[0..i-1]), for interior i (1..k-2)
                prefix_any = [None] * k
                prefix_any[1] = occ_list[0]
                for i in range(2, k - 1):
                    nb = self.model.NewBoolVar(f"pre_{tag}_{i}")
                    self.model.AddMaxEquality(nb, [prefix_any[i - 1], occ_list[i - 1]])
                    prefix_any[i] = nb

                # suffix_any[i] = OR(occ_list[i+1..k-1]), for interior i (1..k-2)
                suffix_any = [None] * k
                suffix_any[k - 2] = occ_list[k - 1]
                for i in range(k - 3, 0, -1):
                    nb = self.model.NewBoolVar(f"suf_{tag}_{i}")
                    self.model.AddMaxEquality(nb, [suffix_any[i + 1], occ_list[i + 1]])
                    suffix_any[i] = nb

                for i in range(1, k - 1):
                    gap_b = self.model.NewBoolVar(f"gap_{tag}_{i}")
                    self.model.AddBoolAnd(
                        [occ_list[i].Not(), prefix_any[i], suffix_any[i]]
                    ).OnlyEnforceIf(gap_b)
                    self.model.AddBoolOr(
                        [occ_list[i], prefix_any[i].Not(), suffix_any[i].Not()]
                    ).OnlyEnforceIf(gap_b.Not())
                    penalty_terms.append(weight * gap_b)
                n += 1
        return n
