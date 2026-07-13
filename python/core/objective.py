"""Combines the placement/day-load/theory/online/Saturday/compactness terms
into the final 4-level (+ soft-penalty) Maximize() objective.

Objective priority hierarchy:
  P1: BIG_M × weighted_placed         ← maximise sessions (dominant)
  P2: BALANCE_WEIGHT × imbalance      ← minimise max−min day spread
  P3: DEV_WEIGHT × Σdev[d]            ← minimise mean-abs deviation
  P4: SAT_PENALTY × saturday_load     ← discourage Saturday overflow
  P5: theory soft-constraint penalties (includes course-spread)
  P6: online-delivery penalty
  P7: per-lecture Saturday penalty
  P8: compactness penalties (faculty/entity gaps + faculty load cap)

BIG_M = len(sessions) + 1 guarantees placing one more session always
outweighs any reduction in secondary/tertiary/quaternary penalties.
"""

from ..config import (
    BALANCE_WEIGHT,
    DEV_WEIGHT,
    ONLINE_PENALTY,
    SAT_LECTURE_PENALTY,
    SAT_PENALTY,
    SESSION_WEIGHTS,
)


class ObjectiveMixin:
    def _build_objective(
        self, state, day_load_state, theory_penalty_terms, compactness_penalty_terms
    ) -> None:
        objective_terms = state["objective_terms"]
        online_penalty_terms = state["online_penalty_terms"]

        imbalance = day_load_state["imbalance"]
        dev_vars = day_load_state["dev_vars"]
        saturday_load = day_load_state["saturday_load"]
        avg_load = day_load_state["avg_load"]
        sat_lecture_penalty_terms = day_load_state["sat_lecture_penalty_terms"]

        BIG_M = len(self.sessions) + 1
        weighted_placed = sum(objective_terms)

        obj = BIG_M * weighted_placed - BALANCE_WEIGHT * imbalance
        obj = obj - DEV_WEIGHT * sum(dev_vars)
        if saturday_load is not None:
            obj = obj - SAT_PENALTY * saturday_load
        if theory_penalty_terms:
            obj = obj - sum(theory_penalty_terms)
        if online_penalty_terms:
            obj = obj - sum(online_penalty_terms)
        if sat_lecture_penalty_terms:
            obj = obj - sum(sat_lecture_penalty_terms)
        if compactness_penalty_terms:
            obj = obj - sum(compactness_penalty_terms)

        self.model.Maximize(obj)

        total_weight = sum(SESSION_WEIGHTS.get(s["type"], 1) for s in self.sessions)
        sat_desc = (
            f" − {SAT_PENALTY}×saturday_load" if saturday_load is not None else ""
        )
        theory_desc = (
            " − Σ(theory soft-constraint penalties)" if theory_penalty_terms else ""
        )
        online_desc = (
            f" − Σ({ONLINE_PENALTY}×online_lecture)" if online_penalty_terms else ""
        )
        sat_lecture_desc = (
            f" − Σ({SAT_LECTURE_PENALTY}×sat_lecture)"
            if sat_lecture_penalty_terms
            else ""
        )
        compactness_desc = (
            " − Σ(compactness penalties)" if compactness_penalty_terms else ""
        )
        print(
            f"  OK Objective (v16, 4-level + theory/compactness soft constraints "
            f"+ online/Saturday penalties):\n"
            f"      Maximize  {BIG_M}xweighted_placed\n"
            f"              - {BALANCE_WEIGHT}ximbalance\n"
            f"              - {DEV_WEIGHT}xSum|day_load[d]-{avg_load}|"
            f"{sat_desc}"
            f"{theory_desc}"
            f"{online_desc}"
            f"{sat_lecture_desc}"
            f"{compactness_desc}\n"
            f"    (CT days fixed by CT_MATRIX — no CT balance term)\n"
            f"    (max_weight={total_weight * BIG_M}, "
            f"BIG_M={BIG_M}, BALANCE_WEIGHT={BALANCE_WEIGHT})"
        )
