from pathlib import Path

from python.storage import DATA_DIR, OUTPUT_DIR, STORAGE_DIR, UPLOAD_DIR


def test_storage_dirs_are_under_the_python_package():
    for d in (UPLOAD_DIR, OUTPUT_DIR, DATA_DIR):
        assert STORAGE_DIR in d.parents


def test_storage_dirs_exist_on_import():
    # storage.py creates these at import time so route handlers can write
    # to them immediately without a separate setup step.
    for d in (UPLOAD_DIR, OUTPUT_DIR, DATA_DIR):
        assert isinstance(d, Path)
        assert d.is_dir()
