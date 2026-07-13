"""Orchestrator: builds the shared helper vars once, then runs each theory
soft-constraint rule and combines their penalty terms into one list."""


class TheoryOrchestratorMixin:
    def _add_theory_soft_constraints(self) -> list:
        penalty_terms: list = []

        helpers = self._build_theory_helper_vars()
        if helpers is None:
            print("  ℹ Theory soft constraints: no Theory sessions found, skipping")
            return penalty_terms

        r0 = self._theory_rule_same_day_same_subject(helpers, penalty_terms)
        r1 = self._theory_rule_subject_adjacency(helpers, penalty_terms)
        r2 = self._theory_rule_room_pairing(helpers, penalty_terms)
        r3, r4 = self._theory_rule_slot_position(helpers, penalty_terms)
        r5 = self._theory_rule_course_spread(helpers, penalty_terms)
        r6 = self._theory_rule_entity_gap(helpers, penalty_terms)
        r7 = self._theory_rule_faculty_gap(helpers, penalty_terms)

        print(
            f"  ✓ Theory soft constraints: "
            f"same-day-same-subject={r0}, "
            f"subject-adjacency={r1}, room-pairing={r2}, "
            f"early-slot={r3}, late-slot={r4}, course-spread={r5}, "
            f"entity-gap={r6}, faculty-gap={r7}"
        )
        return penalty_terms
