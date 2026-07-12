"""Pure CT_MATRIX lookup helpers — no solver state involved."""

from ...config import CT_MATRIX


def get_ct_day(division: str) -> int | None:
    """Return the 0-based day index on which *division* holds CT.

    Returns None if the division is not in CT_MATRIX (i.e. not a FY division
    with a CT slot).  Day index 0 = Monday … 6 = Sunday.

    Examples
    --------
    >>> get_ct_day("CS1")
    0          # Monday
    >>> get_ct_day("CS3")
    2          # Wednesday
    >>> get_ct_day("CT_AI1")
    None       # CT track groups are not in CT_MATRIX
    """
    row = CT_MATRIX.get(division)
    if row is None:
        return None
    try:
        return row.index(1)
    except ValueError:
        return None  # malformed row (should not happen after validation)


def is_ct_day(division: str, day: int) -> bool:
    """Return True iff CT_MATRIX says *division* holds CT on *day*.

    Parameters
    ----------
    division : str
        FY division key (e.g. "CS1", "IT2").
    day : int
        0-based day index (0=Monday … 6=Sunday).

    Returns False for any division not in CT_MATRIX (CT track groups, etc.).
    """
    row = CT_MATRIX.get(division)
    if row is None or day < 0 or day >= len(row):
        return False
    return row[day] == 1


def get_ct_divisions(day_index):
    divisions = []
    for div, matrix in CT_MATRIX.items():
        if matrix[day_index] == 1:
            divisions.append(div)
    return divisions
