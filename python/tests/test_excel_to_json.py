import pandas as pd
import pytest

from python.routes.schedule import _excel_to_json


@pytest.fixture
def sample_workbook(tmp_path):
    path = tmp_path / "sample.xlsx"
    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        pd.DataFrame({"Index": [1, 2], "Slot": ["08:30-09:25", "09:25-10:20"]}).to_excel(
            writer, sheet_name="Time", index=False
        )
        pd.DataFrame({"Rooms": ["D010"], "Type": ["Theory"]}).to_excel(
            writer, sheet_name="Rooms", index=False
        )
    return path


def test_converts_every_sheet(sample_workbook):
    result = _excel_to_json(sample_workbook)
    assert set(result.keys()) == {"Time", "Rooms"}


def test_converts_rows_to_plain_dicts(sample_workbook):
    result = _excel_to_json(sample_workbook)
    assert result["Time"] == [
        {"Index": 1, "Slot": "08:30-09:25"},
        {"Index": 2, "Slot": "09:25-10:20"},
    ]
    assert result["Rooms"] == [{"Rooms": "D010", "Type": "Theory"}]


def test_raises_value_error_for_invalid_file(tmp_path):
    bad_path = tmp_path / "not_excel.xlsx"
    bad_path.write_text("this is not a real excel file")
    with pytest.raises(ValueError, match="Could not parse Excel file"):
        _excel_to_json(bad_path)
