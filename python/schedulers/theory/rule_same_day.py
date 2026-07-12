"""Rule (0): same entity+course scheduled twice on the same day → penalty."""

from collections import defaultdict

from ...config import SAME_DAY_SAME_SUBJECT_PENALTY


class TheoryRuleSameDayMixin:
    def _theory_rule_same_day_same_subject(self, helpers, penalty_terms) -> int:
        is_at = helpers["is_at"]
        r0 = 0
        for entity, sess_list in helpers["entity_sessions"].items():
            by_course: dict[str, list] = defaultdict(list)
            for s in sess_list:
                by_course[s["course"]].append(s)

            for course, c_sessions in by_course.items():
                if len(c_sessions) < 2:
                    continue
                sids = [s["id"] for s in c_sessions]

                for day in range(len(self.days)):
                    day_globals = [
                        g
                        for g in self.allowed_theory_starts
                        if self.global_to_day_slot[g][0] == day
                    ]
                    if not day_globals:
                        continue

                    bvs = [is_at[sid][g] for sid in sids for g in day_globals]
                    if not bvs:
                        continue

                    count_var = self.model.NewIntVar(
                        0, len(bvs), f"sdsj_count_{entity}_{course}_{day}"
                    )
                    self.model.Add(count_var == sum(bvs))

                    violation = self.model.NewBoolVar(
                        f"sdsj_viol_{entity}_{course}_{day}"
                    )
                    self.model.Add(count_var >= 2).OnlyEnforceIf(violation)
                    self.model.Add(count_var <= 1).OnlyEnforceIf(violation.Not())

                    penalty_terms.append(SAME_DAY_SAME_SUBJECT_PENALTY * violation)
                    r0 += 1
        return r0
