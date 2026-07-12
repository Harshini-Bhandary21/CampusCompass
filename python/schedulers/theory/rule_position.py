"""Rules (3) and (4): early-slot / late-slot theory placement penalties."""

from ortools.sat.python import cp_model

from ...config import LOW_THEORY_PENALTY, MEDIUM_THEORY_PENALTY, THEORY_EARLY_SLOTS, THEORY_LATE_SLOTS


class TheoryRulePositionMixin:
    def _theory_rule_slot_position(self, helpers, penalty_terms) -> tuple[int, int]:
        all_theory_dom_set = set(self.allowed_theory_starts)
        r3 = r4 = 0
        for s in helpers["theory_sessions"]:
            sid = s["id"]
            start_v = self.session_starts[sid]
            placed_v = s["placed_var"]

            early_globals = [
                g
                for g in self.allowed_theory_starts
                if self.global_to_day_slot[g][1] in THEORY_EARLY_SLOTS
            ]
            late_globals = [
                g
                for g in self.allowed_theory_starts
                if self.global_to_day_slot[g][1] in THEORY_LATE_SLOTS
            ]

            if early_globals:
                early_bool = self.model.NewBoolVar(f"early_{sid}")
                early_dom = cp_model.Domain.FromValues(early_globals)
                rest_dom = cp_model.Domain.FromValues(
                    sorted(all_theory_dom_set - set(early_globals))
                )
                self.model.AddImplication(early_bool, placed_v)
                self.model.AddLinearExpressionInDomain(
                    start_v, early_dom
                ).OnlyEnforceIf(early_bool)
                if rest_dom.size() > 0:
                    self.model.AddLinearExpressionInDomain(
                        start_v, rest_dom
                    ).OnlyEnforceIf([early_bool.Not(), placed_v])
                penalty_terms.append(MEDIUM_THEORY_PENALTY * early_bool)
                r3 += 1

            if late_globals:
                late_bool = self.model.NewBoolVar(f"late_{sid}")
                late_dom = cp_model.Domain.FromValues(late_globals)
                rest_dom = cp_model.Domain.FromValues(
                    sorted(all_theory_dom_set - set(late_globals))
                )
                self.model.AddImplication(late_bool, placed_v)
                self.model.AddLinearExpressionInDomain(start_v, late_dom).OnlyEnforceIf(
                    late_bool
                )
                if rest_dom.size() > 0:
                    self.model.AddLinearExpressionInDomain(
                        start_v, rest_dom
                    ).OnlyEnforceIf([late_bool.Not(), placed_v])
                penalty_terms.append(LOW_THEORY_PENALTY * late_bool)
                r4 += 1

        return r3, r4
