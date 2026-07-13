"""Faculty daily-load cap — soft penalty for a faculty's total scheduled
duration on a single day exceeding FACULTY_DAILY_LOAD_CAP slots, so a
faculty's whole week doesn't get stacked onto 2-3 marathon days.

Applies to every session type (Theory/Lab/Tutorial), unlike the gap rules
in schedulers/theory/rule_gap.py — a faculty's daily load includes their
labs, not just their lectures. Built entirely from core/day_load.py's
self._on_day_bool (already computed for every session/day, already proven
cheap — see schedulers/theory/rule_gap.py's docstring for the perf story
behind why this rule deliberately avoids the eff_start/eff_end approach
that used to live here).
"""

from ...config import FACULTY_DAILY_LOAD_CAP, FACULTY_LOAD_CAP_PENALTY


class CompactnessRuleFacultyLoadCapMixin:
    def _compactness_rule_faculty_load_cap(self, helpers, penalty_terms) -> int:
        n = 0
        for faculty, sess_list in helpers["faculty_sessions"].items():
            for day, on_day_bool_for_day in self._on_day_bool.items():
                load_terms = [
                    s["duration"] * on_day_bool_for_day[s["id"]]
                    for s in sess_list
                    if s["id"] in on_day_bool_for_day
                ]
                if not load_terms:
                    continue
                max_load = sum(s["duration"] for s in sess_list)

                load_var = self.model.NewIntVar(0, max_load, f"facload_{n}")
                self.model.Add(load_var == sum(load_terms))

                excess = self.model.NewIntVar(0, max_load, f"facexcess_{n}")
                self.model.AddMaxEquality(
                    excess, [load_var - FACULTY_DAILY_LOAD_CAP, 0]
                )

                penalty_terms.append(FACULTY_LOAD_CAP_PENALTY * excess)
                n += 1
        return n
