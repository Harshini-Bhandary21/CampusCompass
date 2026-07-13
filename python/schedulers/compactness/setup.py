"""Shared grouping helper for the compactness soft constraints.

Faculty/entity gap minimisation lives in schedulers/theory/rule_gap.py
instead (it needs theory's is_at/occ boolean grid — see that module's
docstring for why). What's left here is just the faculty daily-load cap,
which only needs core/day_load.py's self._on_day_bool (already built,
already proven cheap) plus a faculty -> sessions grouping.
"""

from collections import defaultdict


class CompactnessSetupMixin:
    def _build_compactness_helper_vars(self):
        if not self._on_day_bool:
            return None

        faculty_sessions: dict[str, list[dict]] = defaultdict(list)
        for sess in self.sessions:
            faculty_sessions[sess["faculty"]].append(sess)

        return {"faculty_sessions": faculty_sessions}
