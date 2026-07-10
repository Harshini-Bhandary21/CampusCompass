"""Small, stateless helpers shared across the scheduler modules."""

import re

import pandas as pd

from .config import BATCH_TO_DIVISION, FY_DIVISIONS


def parse_cell(cell) -> list[str]:
    if pd.isna(cell) or str(cell).strip() in ("", "nan"):
        return []
    return [
        t.strip().lstrip("*")
        for t in re.split(r"[,]+", str(cell).strip())
        if t.strip().lstrip("*")
    ]


def safe_int(val, default: int = 0) -> int:
    try:
        return int(float(val)) if pd.notna(val) else default
    except Exception:
        return default


# ══════════════════════════════════════════════════════════════════════
#  Division-grouping helper (output-layer only — used by extract_solution()
#  / save_timetable() to add the new "Division" field to timetable rows).
# ══════════════════════════════════════════════════════════════════════
#
# BATCH_TO_DIVISION maps BOTH academic batches (e.g. "C11" → "CS1") AND,
# after _load_ct_batches_from_faculty() runs, CT track batches (e.g.
# "AI11" → "CT_AI"). Only the former should ever be collapsed into a
# division. CT tracks must keep showing their own label unchanged, so we
# only accept a BATCH_TO_DIVISION hit when the mapped target is a real
# academic division (i.e. present in FY_DIVISIONS / CT_MATRIX-eligible
# divisions, not a "CT_*" pseudo-division). Anything else — including
# already-division-level labels like "CS1" itself, and CT track labels
# like "AI11", "ROBO2" — is returned unchanged.
def _batch_to_academic_division(label: str) -> str:
    """Map an academic batch to its parent division; leave CT tracks,
    already-division labels, and anything unrecognised unchanged."""
    div = BATCH_TO_DIVISION.get(label)
    if div is not None and div in FY_DIVISIONS:
        return div
    return label
