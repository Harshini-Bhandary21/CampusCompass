"""Division -> batch hierarchy and the derived FY division list.

CT_* batch groups are NOT hardcoded here. They are populated dynamically
from the Faculty sheet by _load_ct_batches_from_faculty() (see
schedulers/ct/batch_loader.py), which is called inside load_data(). That
function mutates DIVISION_TO_BATCHES and rebuilds BATCH_TO_DIVISION
in-place so all downstream code sees the live data without any changes.
"""

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
}

BATCH_TO_DIVISION: dict[str, str] = {
    b: div for div, batches in DIVISION_TO_BATCHES.items() for b in batches
}

# FY divisions that receive a CT day assignment.
# These are all keys in DIVISION_TO_BATCHES that do NOT start with "CT_".
# CT_* pseudo-divisions (AI1, AR1, etc.) are the track entities; they are
# NOT assigned a CT day because they ARE the CT tracks.
FY_DIVISIONS: list[str] = [
    div for div in DIVISION_TO_BATCHES if not div.startswith("CT_")
]
