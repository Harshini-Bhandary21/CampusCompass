"""Shared on-disk storage locations for uploaded/generated files and the
persisted JSON record of each generation run. Used by both route modules."""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOAD_DIR = STORAGE_DIR / "uploads"
OUTPUT_DIR = STORAGE_DIR / "outputs"
DATA_DIR = STORAGE_DIR / "data"

for _dir in (UPLOAD_DIR, OUTPUT_DIR, DATA_DIR):
    _dir.mkdir(parents=True, exist_ok=True)
