"""Static configuration for the Timetable Scheduler.

Everything here is data, not logic: division/batch hierarchies, room/course
name mappings, and the tunable weights that shape the CP-SAT objective.
Split across divisions.py / rooms.py / weights.py / ct_matrix.py by topic;
re-exported here so `from ..config import X` keeps working everywhere.
"""

from .divisions import BATCH_TO_DIVISION, DIVISION_TO_BATCHES, FY_DIVISIONS
from .rooms import COURSE_LAB_ABBREV_EXACT, COURSE_LAB_MAP, CT_ROOM_MAPPING
from .weights import (
    BALANCE_WEIGHT,
    DEV_WEIGHT,
    HIGH_THEORY_PENALTY,
    LOW_THEORY_PENALTY,
    MEDIUM_THEORY_PENALTY,
    ONLINE_PENALTY,
    SAME_DAY_SAME_SUBJECT_PENALTY,
    SAT_LECTURE_PENALTY,
    SAT_PENALTY,
    SESSION_WEIGHTS,
    THEORY_EARLY_SLOTS,
    THEORY_LATE_SLOTS,
    THEORY_PAIRED_SLOT_STARTS,
)
from .ct_matrix import CT_MATRIX

__all__ = [
    "DIVISION_TO_BATCHES",
    "BATCH_TO_DIVISION",
    "FY_DIVISIONS",
    "COURSE_LAB_MAP",
    "COURSE_LAB_ABBREV_EXACT",
    "CT_ROOM_MAPPING",
    "SESSION_WEIGHTS",
    "BALANCE_WEIGHT",
    "DEV_WEIGHT",
    "SAT_PENALTY",
    "HIGH_THEORY_PENALTY",
    "MEDIUM_THEORY_PENALTY",
    "LOW_THEORY_PENALTY",
    "SAME_DAY_SAME_SUBJECT_PENALTY",
    "ONLINE_PENALTY",
    "SAT_LECTURE_PENALTY",
    "THEORY_PAIRED_SLOT_STARTS",
    "THEORY_EARLY_SLOTS",
    "THEORY_LATE_SLOTS",
    "CT_MATRIX",
]
