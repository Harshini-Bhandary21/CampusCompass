"""Orchestrator: builds the shared faculty grouping once, then runs the
faculty daily-load-cap rule and returns its penalty terms for
core/objective.py. Faculty/entity gap minimisation is NOT here — see
schedulers/theory/rule_gap.py's docstring for why it moved."""


class CompactnessOrchestratorMixin:
    def _add_compactness_soft_constraints(self) -> list:
        penalty_terms: list = []

        helpers = self._build_compactness_helper_vars()
        if helpers is None:
            print("  ℹ Compactness soft constraints: no day-load data, skipping")
            return penalty_terms

        r0 = self._compactness_rule_faculty_load_cap(helpers, penalty_terms)

        print(f"  ✓ Compactness soft constraints: faculty-load-cap={r0}")
        return penalty_terms
