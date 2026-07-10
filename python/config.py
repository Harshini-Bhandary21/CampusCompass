"""
Static configuration for the Timetable Scheduler.

Everything here is data, not logic: division/batch hierarchies, room/course
name mappings, and the tunable weights that shape the CP-SAT objective.
"""

# ══════════════════════════════════════════════════════════════════════
#  Division → Batch hierarchy
# ══════════════════════════════════════════════════════════════════════
DIVISION_TO_BATCHES: dict[str, list[str]] = {
    "AL1": ["A11", "A12", "A13", "A14", "A15"],
    "AL2": ["A21", "A22", "A23", "A24", "A25"],
    "CS1": ["C11", "C12", "C13", "C14", "C15"],
    "CS2": ["C21", "C22", "C23", "C24", "C25"],
    "CS3": ["C31", "C32", "C33", "C34", "C35"],
    "CS4": ["C41", "C42", "C43", "C44", "C45"],
    "IT1": ["I11", "I12", "I13", "I14", "I15"],
    "IT2": ["I21", "I22", "I23", "I24", "I25"],
    "ET1": ["E11", "E12", "E13", "E14", "E15"],
    "ET2": ["E21", "E22", "E23", "E24", "E25"],
    "SE1": ["S11", "S12", "S13", "S14", "S15"],
    "SE2": ["S21", "S22", "S23", "S24", "S25"],
    "ME1": ["M11", "M12", "M13"],
    "ME2": ["M21", "M22", "M23"],
    "DS1": ["D11", "D12", "D13"],
    "DS2": ["D21", "D22", "D23"],
    "CV": ["CV1", "CV2", "CV3"],
    "CH": ["CH1", "CH2", "CH3"],
    # CT_* batch groups are NOT hardcoded here.
    # They are populated dynamically from the Faculty sheet by
    # _load_ct_batches_from_faculty() (see ct.py) which is called inside
    # load_data(). That function mutates DIVISION_TO_BATCHES and rebuilds
    # BATCH_TO_DIVISION in-place so all downstream code sees the live data
    # without any changes.
}

BATCH_TO_DIVISION: dict[str, str] = {
    b: div for div, batches in DIVISION_TO_BATCHES.items() for b in batches
}

COURSE_LAB_MAP: dict[str, str] = {
    "engineering physics": "Engineering Physics Lab",
    "foundation of computing": "Foundation of Computing Lab",
    "science of nature (son-chem)": "Science of Nature (SON-Chem) Lab",
    "applied mechanics": "Applied Mechanics Lab",
    "design thinking": "Design Thinking Lab",
    "electronics and electrical": "Electronics and Electrical Engineering Lab",
    "communication skills english": "English For Communication",
    "english for communication": "English For Communication",
    "linux fundamentals": "Linux Fundamentals Lab",
    "physics": "Engineering Physics Lab",
    "son(chem)": "Science of Nature (SON-Chem) Lab",
    "computer aided chemical": "Science of Nature (SON-Chem) Lab",
    "cace": "Science of Nature (SON-Chem) Lab",
    "surveying": "Applied Mechanics Lab",
    "s&g": "Applied Mechanics Lab",
}

COURSE_LAB_ABBREV_EXACT: dict[str, str] = {
    "am": "Applied Mechanics Lab",
    "dt": "Design Thinking Lab",
    "dee": "Electronics and Electrical Engineering Lab",
    "ieee,dee": "Electronics and Electrical Engineering Lab",
    "ieee, dee": "Electronics and Electrical Engineering Lab",
    "isa": "Electronics and Electrical Engineering Lab",
    "lsa": "Linux Fundamentals Lab",
    "linux": "Linux Fundamentals Lab",
    "foc": "Foundation of Computing Lab",
    "ep": "Engineering Physics Lab",
    "son": "Science of Nature (SON-Chem) Lab",
}

# Weights for the objective — higher = solver tries harder to place these.
# Labs get 3× because a missed lab requires manual intervention (room booking,
# faculty coordination across 2 consecutive slots). Adjust as needed.
SESSION_WEIGHTS = {"Lab": 3, "Tutorial": 2, "Theory": 1}

# ── CT-5: CT Track → Lab room mapping ────────────────────────────────────────
#
# Maps CT track keywords (matched against the batch/entity label, case-insensitive)
# to lists of preferred lab room names.  The matching is done with a simple
# substring check so "AI11", "AI_DIV2", etc. all hit the "ai" key.
#
# HOW TO EXTEND:
#   Add a new key (lowercase keyword) and a list of room name strings.
#   The names must exactly match entries in the Rooms sheet.
#   Example:
#       "cybersecurity": ["Cyber Lab 1", "Cyber Lab 2"],
#
# If no key matches the session label, _ct_rooms_for() falls back to
# self.all_lab_rooms (all 26 lab rooms) — preserving existing behaviour.
#
CT_ROOM_MAPPING: dict[str, list[str]] = {
    "ai": [],  # e.g. ["AI Lab 1", "AI Lab 2"]
    "iot": [],  # e.g. ["IoT Lab"]
    "robo": [],  # e.g. ["Robotics Lab"]
    "robot": [],  # alias for "robo"
    "cc": [],  # Cloud Computing
    "cloud": [],  # alias for "cc"
    "ev": [],  # Electric Vehicles
    "drone": [],  # Drone lab
    "ar": [],  # AR / VR
    "vr": [],  # alias for "ar"
    "bct": [],  # Blockchain Technology
    "pe": [],  # Power Electronics
    "zeb": [],  # Zero Energy Buildings
    "aece": [],  # AECE track
}
# NOTE: All lists above are intentionally empty until real room names are
# populated.  An empty list triggers the fallback to self.all_lab_rooms,
# so the scheduler works correctly out-of-the-box with no Excel changes.

# ── Objective tuning constants ────────────────────────────────────────────────
#
# Hierarchy (descending priority):
#   P1: BIG_M × weighted_placed              — never trade a session for balance
#   P2: BALANCE_WEIGHT × imbalance           — penalise max−min day spread
#   P3: DEV_WEIGHT × Σ|day_load[d]−avg|     — penalise mean-absolute deviation
#   P4: SAT_PENALTY × saturday_load          — discourage Saturday overflow
#
# Separation guarantee:
#   BIG_M > BALANCE_WEIGHT × max_imbalance (≤ n_sessions)
#   so placing one more session ALWAYS beats any reduction in imbalance.
#
BALANCE_WEIGHT = 5  # secondary objective coefficient
DEV_WEIGHT = 1  # tertiary deviation coefficient
SAT_PENALTY = 1  # Saturday penalty coefficient

# ── Theory-only soft-constraint penalty weights ──────────────────────────────
#
# These are ADDITIONAL penalty terms layered on top of the existing 4-level
# objective (P1 placement / P2 imbalance / P3 deviation / P4 Saturday).
# They are intentionally much smaller than BIG_M (≈ n_sessions) so that the
# solver NEVER drops a session just to satisfy one of these preferences —
# placement always wins. Internally they keep a strict hierarchy:
#     HIGH_THEORY_PENALTY >> MEDIUM_THEORY_PENALTY >> LOW_THEORY_PENALTY
#
HIGH_THEORY_PENALTY = 50  # (1) same-subject adjacency, (2) different-room pairing
MEDIUM_THEORY_PENALTY = 10  # (3) early-slot (1 or 2) theory placement
LOW_THEORY_PENALTY = 2  # (4) late-slot (10 or 11) theory placement
SAME_DAY_SAME_SUBJECT_PENALTY = 20  # (0) same entity+course twice on same day

# ── Additional per-session soft-constraint penalty weights ────────────────────
#
# Layered on top of the existing objective exactly like the theory penalties
# above — same mechanism (BoolVar x coefficient, summed and subtracted), same
# guarantee that BIG_M placement always dominates.
#
ONLINE_PENALTY = 30  # any session delivered online (medium-to-high)
SAT_LECTURE_PENALTY = 10  # any session placed on Saturday (medium), per-lecture

# Local (1-based) slot numbers used by the paired-classroom preference (2).
THEORY_PAIRED_SLOT_STARTS = [1, 3, 6, 8, 10]

# Local (1-based) slot numbers treated as "early" / "late" for rules (3) / (4).
THEORY_EARLY_SLOTS = {1, 2}
THEORY_LATE_SLOTS = {10, 11}

# FY divisions that receive a CT day assignment.
# These are all keys in DIVISION_TO_BATCHES that do NOT start with "CT_".
# CT_* pseudo-divisions (AI1, AR1, etc.) are the track entities; they are
# NOT assigned a CT day because they ARE the CT tracks.
FY_DIVISIONS: list[str] = [
    div for div in DIVISION_TO_BATCHES if not div.startswith("CT_")
]

# ══════════════════════════════════════════════════════════════════════
#  CT_MATRIX  —  Static data-driven CT day allocation  (CT-O)
# ══════════════════════════════════════════════════════════════════════
#
# Maps every FY division to a 7-element binary list:
#   Index:  0=Monday  1=Tuesday  2=Wednesday  3=Thursday
#           4=Friday  5=Saturday  6=Sunday
#
# Rules:
#   • Exactly ONE element must be 1 per division (one CT day per week).
#   • CT always occupies the 15:10–16:50 slot on the assigned day.
#   • The solver does NOT choose or optimise CT days — this matrix is final.
#
# FUTURE: To move this into an Excel sheet, replace this dict literal with
# a loader function that reads the "CT Matrix" sheet from the input workbook.
# The solver logic (get_ct_day / is_ct_day / CT blocking) does not change.
#
CT_MATRIX: dict[str, list[int]] = {
    #     Mon Tue Wed Thu Fri Sat Sun
    "AL1": [1, 0, 0, 0, 0, 0, 0],
    "AL2": [0, 1, 0, 0, 0, 0, 0],
    "CS1": [1, 0, 0, 0, 0, 0, 0],
    "CS2": [0, 1, 0, 0, 0, 0, 0],
    "CS3": [0, 0, 1, 0, 0, 0, 0],
    "CS4": [0, 0, 0, 1, 0, 0, 0],
    "IT1": [1, 0, 0, 0, 0, 0, 0],
    "IT2": [0, 1, 0, 0, 0, 0, 0],
    "ET1": [0, 0, 1, 0, 0, 0, 0],
    "ET2": [0, 0, 0, 1, 0, 0, 0],
    "SE1": [1, 0, 0, 0, 0, 0, 0],
    "SE2": [0, 1, 0, 0, 0, 0, 0],
    "ME1": [0, 0, 1, 0, 0, 0, 0],
    "ME2": [0, 0, 0, 1, 0, 0, 0],
    "DS1": [1, 0, 0, 0, 0, 0, 0],
    "DS2": [0, 1, 0, 0, 0, 0, 0],
    "CV": [0, 0, 1, 0, 0, 0, 0],
    "CH": [0, 0, 0, 1, 0, 0, 0],
}


def _validate_ct_matrix() -> None:
    """Validate CT_MATRIX at import time: every row must have exactly one 1."""
    errors = []
    for div, row in CT_MATRIX.items():
        if len(row) != 7:
            errors.append(f"  CT_MATRIX['{div}']: expected 7 columns, got {len(row)}")
        ones = sum(row)
        if ones != 1:
            errors.append(
                f"  CT_MATRIX['{div}']: must have exactly 1 CT day, found {ones}"
            )
    if errors:
        raise ValueError("CT_MATRIX validation failed:\n" + "\n".join(errors))


_validate_ct_matrix()
