"""Rules (1) and (2): adjacent/paired theory slot preferences for the same
entity — same-subject adjacency and different-room pairing."""

from ...config import HIGH_THEORY_PENALTY, THEORY_PAIRED_SLOT_STARTS


class TheoryRuleAdjacencyMixin:
    # ═══ Rule (1): adjacent theory lectures, same entity, same subject → HIGH penalty ═══
    def _theory_rule_subject_adjacency(self, helpers, penalty_terms) -> int:
        occ = helpers["occ"]
        course_var = helpers["course_var"]
        all_adj_pairs = self._theory_adjacent_pairs()
        r1 = 0
        for entity in helpers["entity_sessions"]:
            for g1, g2 in all_adj_pairs:
                o1, o2 = occ[(entity, g1)], occ[(entity, g2)]
                cv1, cv2 = course_var[(entity, g1)], course_var[(entity, g2)]

                same_course = self.model.NewBoolVar(f"samecourse_{entity}_{g1}_{g2}")
                self.model.Add(cv1 == cv2).OnlyEnforceIf(same_course)
                self.model.Add(cv1 != cv2).OnlyEnforceIf(same_course.Not())

                violation = self.model.NewBoolVar(f"viol_subj_{entity}_{g1}_{g2}")
                self.model.AddBoolAnd([o1, o2, same_course]).OnlyEnforceIf(violation)
                self.model.AddBoolOr(
                    [o1.Not(), o2.Not(), same_course.Not()]
                ).OnlyEnforceIf(violation.Not())

                penalty_terms.append(HIGH_THEORY_PENALTY * violation)
                r1 += 1
        return r1

    # ═══ Rule (2): paired theory slots, same entity, different rooms → HIGH penalty ═══
    def _theory_rule_room_pairing(self, helpers, penalty_terms) -> int:
        occ = helpers["occ"]
        roomvar_at = helpers["roomvar_at"]
        paired_pairs = self._theory_adjacent_pairs(
            slot_filter=set(THEORY_PAIRED_SLOT_STARTS)
        )
        r2 = 0
        for entity in helpers["entity_sessions"]:
            for g1, g2 in paired_pairs:
                o1, o2 = occ[(entity, g1)], occ[(entity, g2)]
                rv1, rv2 = roomvar_at[(entity, g1)], roomvar_at[(entity, g2)]

                same_room = self.model.NewBoolVar(f"sameroom_{entity}_{g1}_{g2}")
                self.model.Add(rv1 == rv2).OnlyEnforceIf(same_room)
                self.model.Add(rv1 != rv2).OnlyEnforceIf(same_room.Not())

                violation = self.model.NewBoolVar(f"viol_room_{entity}_{g1}_{g2}")
                self.model.AddBoolAnd([o1, o2, same_room.Not()]).OnlyEnforceIf(
                    violation
                )
                self.model.AddBoolOr([o1.Not(), o2.Not(), same_room]).OnlyEnforceIf(
                    violation.Not()
                )

                penalty_terms.append(HIGH_THEORY_PENALTY * violation)
                r2 += 1
        return r2
