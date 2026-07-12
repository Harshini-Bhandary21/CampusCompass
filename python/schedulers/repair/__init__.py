"""ITERATIVE REPAIR — capture / freeze / LNS neighbourhood / loop.

See loop.py's module docstring for the overall repair-pass design.
"""

from .capture import RepairCaptureMixin
from .lns import LNSMixin
from .loop import RepairLoopMixin


class RepairMixin(RepairCaptureMixin, LNSMixin, RepairLoopMixin):
    """Iterative-repair / LNS instance methods, mixed into TimetableScheduler."""


__all__ = ["RepairMixin"]
