"""Output-layer division-grouping helper.

Used by extract_solution() / save_timetable() to add the "Division" field
to timetable rows.

BATCH_TO_DIVISION maps BOTH academic batches (e.g. "C11" → "CS1") AND,
after _load_ct_batches_from_faculty() runs, CT track batches (e.g.
"AI11" → "CT_AI"). Only the former should ever be collapsed into a
division. CT tracks must keep showing their own label unchanged, so we
only accept a BATCH_TO_DIVISION hit when the mapped target is a real
academic division (i.e. present in FY_DIVISIONS / CT_MATRIX-eligible
divisions, not a "CT_*" pseudo-division). Anything else — including
already-division-level labels like "CS1" itself, and CT track labels
like "AI11", "ROBO2" — is returned unchanged.
"""

from ..config import BATCH_TO_DIVISION, FY_DIVISIONS


def _batch_to_academic_division(label: str) -> str:
    """Map an academic batch to its parent division; leave CT tracks,
    already-division labels, and anything unrecognised unchanged."""
    div = BATCH_TO_DIVISION.get(label)
    if div is not None and div in FY_DIVISIONS:
        return div
    return label
