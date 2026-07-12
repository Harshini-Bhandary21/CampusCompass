"""Everything CT ("Continuous Test" institute-wide slot) related.

CT is not a solver decision — CT_MATRIX statically fixes which weekday each
FY division holds its CT slot on (15:10–16:50). This package owns:

  * CT_MATRIX lookups (get_ct_day / is_ct_day / get_ct_divisions) — matrix_lookup.py
  * Populating CT_* batch groups dynamically from the Faculty sheet — batch_loader.py
  * CT room resolution/isolation — rooms.py
  * Pinning/blocking CT slots inside the CP-SAT model — model_pins.py
  * CT allocation reporting/display helpers — allocation.py

CTMixin is mixed into TimetableScheduler (see core/scheduler.py) — its
methods read/write the scheduler's shared self.* state exactly like the
methods defined directly on the class.
"""

from .allocation import CTAllocationMixin
from .batch_loader import _build_ct_batches_by_day, _load_ct_batches_from_faculty
from .matrix_lookup import get_ct_day, get_ct_divisions, is_ct_day
from .model_pins import CTModelPinsMixin
from .rooms import CTRoomsMixin


class CTMixin(CTRoomsMixin, CTModelPinsMixin, CTAllocationMixin):
    """CT-specific instance methods, mixed into TimetableScheduler."""


__all__ = [
    "CTMixin",
    "get_ct_day",
    "is_ct_day",
    "get_ct_divisions",
    "_load_ct_batches_from_faculty",
    "_build_ct_batches_by_day",
]
