"""Compactness soft constraints — schedule "tightness" preferences that sit
alongside the theory-only rules in schedulers/theory/.

Only the faculty daily-load cap lives here (rule_faculty_load_cap.py) —
penalise a faculty's total slot-load on a single day exceeding
FACULTY_DAILY_LOAD_CAP, using core/day_load.py's self._on_day_bool (already
built, already proven cheap).

Faculty/entity gap minimisation is NOT here — an earlier version computed
gaps via AddMinEquality/AddMaxEquality over sentinel-masked "effective
start/end" IntVars spanning all session types, and that measurably stalled
the solver (see schedulers/theory/rule_gap.py's docstring). Gap
minimisation now lives in schedulers/theory/rule_gap.py instead, built on
the theory package's existing is_at/occ boolean grid with cheap prefix/
suffix OR chains.
"""

from .orchestrator import CompactnessOrchestratorMixin
from .rule_faculty_load_cap import CompactnessRuleFacultyLoadCapMixin
from .setup import CompactnessSetupMixin


class CompactnessMixin(
    CompactnessSetupMixin,
    CompactnessRuleFacultyLoadCapMixin,
    CompactnessOrchestratorMixin,
):
    """Compactness-specific instance methods, mixed into TimetableScheduler."""


__all__ = ["CompactnessMixin"]
