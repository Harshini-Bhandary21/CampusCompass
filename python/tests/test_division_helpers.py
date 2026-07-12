from python.utils.division_helpers import _batch_to_academic_division


def test_academic_batch_maps_to_parent_division():
    assert _batch_to_academic_division("C11") == "CS1"
    assert _batch_to_academic_division("A21") == "AL2"


def test_division_level_label_returned_unchanged():
    assert _batch_to_academic_division("CS1") == "CS1"


def test_ct_track_label_returned_unchanged():
    # CT_* pseudo-divisions are never real DIVISION_TO_BATCHES keys, so a
    # CT track batch (e.g. "AI11") has no BATCH_TO_DIVISION entry pointing
    # at a real FY division and must pass through unchanged.
    assert _batch_to_academic_division("AI11") == "AI11"


def test_unrecognised_label_returned_unchanged():
    assert _batch_to_academic_division("NOT_A_REAL_BATCH") == "NOT_A_REAL_BATCH"
