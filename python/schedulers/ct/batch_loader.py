"""CT Batch Loader — reads CT batch groups from the Faculty sheet (CT-DYN).

Called once inside load_data() after self.faculty_df is populated.
Scans every row where Course Name == "CT" (case-insensitive) and
collects the batch labels from the "Batch" column.

Each distinct batch is assigned a synthetic CT_* group key using an
auto-incrementing counter so the structure mirrors the old hardcoded
DIVISION_TO_BATCHES entries.  Batches are grouped by their common
alphabetical prefix (letters only, e.g. "AI11" → prefix "AI").

The function:
  1. Clears any existing CT_* keys from DIVISION_TO_BATCHES.
  2. Adds new CT_<PREFIX><N> keys for each discovered prefix group.
  3. Rebuilds BATCH_TO_DIVISION to stay consistent.

No CT_MATRIX changes are made — the FY division→day mapping is fixed.
"""

import re

import pandas as pd

from ...config import BATCH_TO_DIVISION, DIVISION_TO_BATCHES


def _load_ct_batches_from_faculty(faculty_df: "pd.DataFrame") -> None:
    """Populate DIVISION_TO_BATCHES CT_* entries from Faculty sheet.

    Reads rows where Course Name is 'CT', collects unique batch labels
    from the 'Batch' column, groups them by alphabetical prefix, and
    inserts them as CT_<PREFIX><N> keys into DIVISION_TO_BATCHES.
    Also rebuilds BATCH_TO_DIVISION in-place.

    Parameters
    ----------
    faculty_df : pd.DataFrame
        The DataFrame read from the 'Faculty' sheet of the input workbook.
    """
    # ── Step 1: collect all CT batch labels from Faculty sheet ──────────
    cols = {c.strip(): c for c in faculty_df.columns}

    def _col(name: str) -> str | None:
        return cols.get(name)

    course_col = _col("Course Name")
    batch_col = _col("Batch")

    if not course_col or not batch_col:
        print(
            "  ⚠ CT-DYN: 'Course Name' or 'Batch' column not found in Faculty sheet. "
            "CT batch groups will be empty."
        )
        return

    all_ct_batches: list[str] = []
    for _, row in faculty_df.iterrows():
        c_val = row.get(course_col)
        b_val = row.get(batch_col)
        if pd.isna(c_val) or str(c_val).strip().upper() != "CT":
            continue
        if pd.isna(b_val):
            continue
        # Batch cell may be comma/semicolon/space separated
        for token in re.split(r"[,;\s]+", str(b_val).strip()):
            token = token.strip()
            if token and token.upper() != "NAN":
                all_ct_batches.append(token)

    if not all_ct_batches:
        print("  ⚠ CT-DYN: No CT batch rows found in Faculty sheet.")
        return

    # Deduplicate while preserving order
    seen: set[str] = set()
    unique_batches: list[str] = []
    for b in all_ct_batches:
        if b not in seen:
            seen.add(b)
            unique_batches.append(b)

    # ── Step 2: group batches by alphabetical prefix ─────────────────────
    # e.g. "AI11" → prefix "AI", "ROBO3" → prefix "ROBO", "ZEB1" → "ZEB"
    prefix_groups: dict[str, list[str]] = {}
    for b in unique_batches:
        m = re.match(r"^([A-Za-z]+)", b)
        prefix = m.group(1).upper() if m else "CT"
        prefix_groups.setdefault(prefix, []).append(b)

    # ── Step 3: clear existing CT_* entries from DIVISION_TO_BATCHES ────
    old_ct_keys = [k for k in list(DIVISION_TO_BATCHES.keys()) if k.startswith("CT_")]
    for k in old_ct_keys:
        del DIVISION_TO_BATCHES[k]

    # ── Step 4: insert new CT_<PREFIX><N> group keys ──────────────────────
    # Each prefix gets its batches chunked into groups of up to 4
    # (matching the original structure where each group had 4 batches).
    # If a prefix has fewer than 4 batches, they all go in one group.
    CHUNK = 4
    added_groups = 0
    for prefix, batches in sorted(prefix_groups.items()):
        chunks = [batches[i : i + CHUNK] for i in range(0, len(batches), CHUNK)]
        for idx, chunk in enumerate(chunks, start=1):
            if len(chunks) == 1:
                group_key = f"CT_{prefix}"
            else:
                group_key = f"CT_{prefix}{idx}"
            DIVISION_TO_BATCHES[group_key] = chunk
            added_groups += 1

    # ── Step 5: rebuild BATCH_TO_DIVISION ────────────────────────────────
    BATCH_TO_DIVISION.clear()
    for div, batches in DIVISION_TO_BATCHES.items():
        for b in batches:
            BATCH_TO_DIVISION[b] = div

    print(
        f"  ✓ CT-DYN: loaded {len(unique_batches)} CT batches → "
        f"{added_groups} CT_* groups from Faculty sheet "
        f"({sorted(prefix_groups.keys())})"
    )


def _build_ct_batches_by_day() -> dict[int, list[str]]:
    """Map CT day index (0=Mon…3=Thu) to sorted list of active CT batch names.

    Batch suffix 1→day 0 (Mon), 2→day 1 (Tue), 3→day 2 (Wed), 4→day 3 (Thu).
    Used by _print_ct_allocation() and save_timetable() for the CT Allocation sheet.
    """
    result: dict[int, list[str]] = {}
    for ct_key, batches in DIVISION_TO_BATCHES.items():
        if not ct_key.startswith("CT_"):
            continue
        for batch in batches:
            m = re.search(r"(\d+)$", batch)
            if m:
                suffix = int(m.group(1)[-1])
                if 1 <= suffix <= 4:
                    result.setdefault(suffix - 1, []).append(batch)
    for day_idx in result:
        result[day_idx].sort()
    return result
