"""
Timetable Scheduler — CP-SAT  (v16 — CT data-driven static matrix)

CT days are assigned via CT_MATRIX (static dict, not solver variables).
Objective: 4-level (P1 placement, P2 max−min imbalance, P3 deviation, P4 Saturday).
OR-Tools 9.15 API compatibility maintained.

TimetableScheduler is the core orchestrator: __init__ plus the mixins that
each own one piece of the algorithm (data loading, labs, theory, CT,
validation, iterative repair, output, model building, hints, solve) —
each of those modules can be read on its own to understand that piece.
"""

from collections import defaultdict

from ortools.sat.python import cp_model

from ..schedulers.ct import CTMixin
from ..schedulers.labs import LabsMixin
from ..schedulers.repair import RepairMixin
from ..schedulers.theory import TheoryMixin
from .data_loader import DataLoaderMixin
from .diagnostics import DiagnosticsMixin
from .excel_export import ExcelExportMixin
from .hints import HintsMixin
from .lab_session_parser import LabSessionParserMixin
from .model_builder import ModelBuilderMixin
from .output import OutputMixin
from .session_parser import SessionParserMixin
from .solve import SolveMixin
from .validation import ValidationMixin


class TimetableScheduler(
    DataLoaderMixin,
    SessionParserMixin,
    LabSessionParserMixin,
    LabsMixin,
    TheoryMixin,
    CTMixin,
    ValidationMixin,
    DiagnosticsMixin,
    RepairMixin,
    OutputMixin,
    ExcelExportMixin,
    ModelBuilderMixin,
    HintsMixin,
    SolveMixin,
):
    def __init__(self):
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()

        self.faculty_df = self.room_df = self.time_df = None

        self.time_slots: dict[int, str] = {}
        self.time_slots_per_day = 9
        self.lunch_slot = 5

        self.days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        self.online_days: list[int] = [0, 0, 0, 0, 0, 1]

        self.theory_rooms: list[str] = []
        self.subject_lab_rooms: dict[str, list[str]] = {}
        self.all_lab_rooms: list[str] = []

        self.sessions: list[dict] = []

        self.session_starts: dict[int, cp_model.IntVar] = {}
        self.session_ends: dict[int, cp_model.IntVar] = {}
        self.session_intervals: dict[int, cp_model.IntervalVar] = {}
        self.session_room_bools: dict[int, dict] = defaultdict(dict)

        self.global_to_day_slot: dict[int, tuple] = {}
        self.allowed_theory_starts: list[int] = []
        self.allowed_lab_starts: list[int] = []
        self.online_global: set[int] = set()
        self.offline_global: set[int] = set()

        # Set by build_model; used in diagnostic report
        self._day_load_vars: list[cp_model.IntVar] = []
        self._imbalance_var: cp_model.IntVar | None = None
        self._dev_vars: list[cp_model.IntVar] = []

        # CT support: fixed slot set in load_data(); allocation from CT_MATRIX
        self.ct_fixed_slot: int = -1  # local slot index for 15:10 slot (1-based)
        self.ct_fixed_slot2: int = -1  # local slot index for 16:00 slot (1-based)
        self.ct_allocation: dict[int, list[str]] = (
            self._build_ct_allocation_from_matrix()
        )
