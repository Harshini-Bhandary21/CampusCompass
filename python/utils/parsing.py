"""Small, stateless Excel-cell parsing helpers."""

import re

import pandas as pd


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
