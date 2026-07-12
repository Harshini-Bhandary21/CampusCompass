"""The scheduler engine: data loading, session parsing, validation,
CP-SAT model building, warm-start hints, solving, and output — all mixed
into a single TimetableScheduler class. See scheduler.py for the class
assembly and each sibling module for one piece of the pipeline.
"""

from .scheduler import TimetableScheduler

__all__ = ["TimetableScheduler"]
