"""CT_MATRIX — Static data-driven CT day allocation  (CT-O)

Maps every FY division to a 7-element binary list:
  Index:  0=Monday  1=Tuesday  2=Wednesday  3=Thursday
          4=Friday  5=Saturday  6=Sunday

Rules:
  • Exactly ONE element must be 1 per division (one CT day per week).
  • CT always occupies the 15:10–16:50 slot on the assigned day.
  • The solver does NOT choose or optimise CT days — this matrix is final.

FUTURE: To move this into an Excel sheet, replace this dict literal with
a loader function that reads the "CT Matrix" sheet from the input workbook.
The solver logic (get_ct_day / is_ct_day / CT blocking) does not change.
"""

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
