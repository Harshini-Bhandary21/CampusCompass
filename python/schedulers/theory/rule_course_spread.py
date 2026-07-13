"""Rule (5): same entity+course theory sessions landing on consecutive
days → penalty. rule_same_day.py already stops two lectures of the same
course landing on the SAME day; this stops them landing on adjacent days
(e.g. Mon+Tue), which gives better spacing for revision between lectures.

Reuses core/day_load.py's self._on_day_bool directly (built before theory
soft constraints run — see core/model_builder.py) rather than the is_at/occ
helpers from setup.py, since this only needs day membership, not slot-exact
occupancy.
"""

from collections import defaultdict

from ...config import COURSE_SPREAD_PENALTY


class TheoryRuleCourseSpreadMixin:
    def _theory_rule_course_spread(self, helpers, penalty_terms) -> int:
        r5 = 0
        for entity, sess_list in helpers["entity_sessions"].items():
            by_course: dict[str, list] = defaultdict(list)
            for s in sess_list:
                by_course[s["course"]].append(s)

            for course, c_sessions in by_course.items():
                if len(c_sessions) < 2:
                    continue
                for i in range(len(c_sessions)):
                    for j in range(i + 1, len(c_sessions)):
                        sid1 = c_sessions[i]["id"]
                        sid2 = c_sessions[j]["id"]
                        for day in range(len(self.days) - 1):
                            if self._add_course_spread_penalty(
                                sid1, sid2, day, penalty_terms
                            ):
                                r5 += 1
        return r5

    def _add_course_spread_penalty(self, sid1, sid2, day, penalty_terms) -> bool:
        day_bools = self._on_day_bool.get(day, {})
        next_bools = self._on_day_bool.get(day + 1, {})
        if sid1 not in day_bools or sid2 not in day_bools:
            return False
        if sid1 not in next_bools or sid2 not in next_bools:
            return False

        tag = f"{sid1}_{sid2}_{day}"

        # sid1 on `day`, sid2 on `day+1`
        a1 = self.model.NewBoolVar(f"spread_a_{tag}")
        self.model.AddBoolAnd([day_bools[sid1], next_bools[sid2]]).OnlyEnforceIf(a1)
        self.model.AddBoolOr(
            [day_bools[sid1].Not(), next_bools[sid2].Not()]
        ).OnlyEnforceIf(a1.Not())

        # sid2 on `day`, sid1 on `day+1`
        a2 = self.model.NewBoolVar(f"spread_b_{tag}")
        self.model.AddBoolAnd([day_bools[sid2], next_bools[sid1]]).OnlyEnforceIf(a2)
        self.model.AddBoolOr(
            [day_bools[sid2].Not(), next_bools[sid1].Not()]
        ).OnlyEnforceIf(a2.Not())

        penalty_terms.append(COURSE_SPREAD_PENALTY * a1)
        penalty_terms.append(COURSE_SPREAD_PENALTY * a2)
        return True
