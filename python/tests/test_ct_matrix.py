"""CT_MATRIX is validated at import time (one CT day per division, 7 columns).
These tests exercise that validation logic directly, since the module-level
check only ever runs once per process and a bad edit wouldn't otherwise be
caught until a real generation run failed confusingly deep in the solver."""

import pytest

from python.config.ct_matrix import CT_MATRIX, _validate_ct_matrix
from python.schedulers.ct.matrix_lookup import get_ct_day, is_ct_day


def test_every_division_has_seven_columns():
    for div, row in CT_MATRIX.items():
        assert len(row) == 7, f"{div} has {len(row)} columns, expected 7"


def test_every_division_has_exactly_one_ct_day():
    for div, row in CT_MATRIX.items():
        assert sum(row) == 1, f"{div} has {sum(row)} CT days, expected exactly 1"


def test_validate_passes_on_current_matrix():
    _validate_ct_matrix()  # should not raise


def test_validate_rejects_wrong_column_count(monkeypatch):
    monkeypatch.setitem(CT_MATRIX, "BAD", [1, 0, 0])
    with pytest.raises(ValueError, match="expected 7 columns"):
        _validate_ct_matrix()


def test_validate_rejects_more_than_one_ct_day(monkeypatch):
    monkeypatch.setitem(CT_MATRIX, "BAD", [1, 1, 0, 0, 0, 0, 0])
    with pytest.raises(ValueError, match="must have exactly 1 CT day"):
        _validate_ct_matrix()


def test_get_ct_day_returns_correct_weekday_index():
    assert get_ct_day("AL1") == 0  # Monday
    assert get_ct_day("CS3") == 2  # Wednesday


def test_get_ct_day_returns_none_for_unknown_division():
    assert get_ct_day("CT_AI1") is None
    assert get_ct_day("NOT_A_DIVISION") is None


def test_is_ct_day_matches_get_ct_day():
    for div in CT_MATRIX:
        day = get_ct_day(div)
        assert is_ct_day(div, day) is True
        other_day = (day + 1) % 7
        assert is_ct_day(div, other_day) is False


def test_is_ct_day_false_for_unknown_division():
    assert is_ct_day("NOT_A_DIVISION", 0) is False
