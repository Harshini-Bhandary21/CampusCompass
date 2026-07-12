"""Theory-only soft constraints (ported from final.py).

setup.py builds the shared per-session/entity CP-SAT vars; each rule_*.py
implements one soft-constraint rule; orchestrator.py runs them all and
combines the penalty terms handed to core/objective.py.
"""

from .orchestrator import TheoryOrchestratorMixin
from .rule_adjacency import TheoryRuleAdjacencyMixin
from .rule_position import TheoryRulePositionMixin
from .rule_same_day import TheoryRuleSameDayMixin
from .setup import TheorySetupMixin


class TheoryMixin(
    TheorySetupMixin,
    TheoryRuleSameDayMixin,
    TheoryRuleAdjacencyMixin,
    TheoryRulePositionMixin,
    TheoryOrchestratorMixin,
):
    """Theory-specific instance methods, mixed into TimetableScheduler."""


__all__ = ["TheoryMixin"]
