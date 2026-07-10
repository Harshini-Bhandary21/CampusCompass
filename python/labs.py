"""Lab-specific room resolution.

Lab sessions get a 2-slot duration and need a room drawn from the pool
dedicated to their subject (falling back to the full lab-room pool when no
dedicated room exists). CT-dedicated rooms are handled separately in ct.py
and never appear in the pools this module draws from (they're isolated out
of self.all_lab_rooms during load_data — see ct.py:_setup_ct_rooms_and_slots).
"""

from .config import COURSE_LAB_ABBREV_EXACT, COURSE_LAB_MAP


class LabsMixin:
    """Lab-specific instance methods, mixed into TimetableScheduler."""

    # ──────────────────────────────────────────────────────────────
    # C10 — Lab room resolver
    # ──────────────────────────────────────────────────────────────
    def _lab_rooms_for(self, course: str, warned: set) -> list[str]:
        cl = course.lower().strip()

        target = COURSE_LAB_ABBREV_EXACT.get(cl)
        if target:
            rooms = [
                r for s, rs in self.subject_lab_rooms.items() if target in s for r in rs
            ]
            if rooms:
                return rooms

        for frag, target in COURSE_LAB_MAP.items():
            if frag in cl:
                rooms = [
                    r
                    for s, rs in self.subject_lab_rooms.items()
                    if target in s
                    for r in rs
                ]
                if rooms:
                    return rooms

        matched = []
        for subj, rooms in self.subject_lab_rooms.items():
            sl = subj.lower().replace(" lab", "").replace(" laboratory", "")
            if any(w in cl for w in sl.split() if len(w) > 3):
                matched.extend(rooms)
        if matched:
            return list(set(matched))

        if course not in warned:
            print(
                f"  ℹ  C10: '{course}' has no dedicated lab → "
                f"using all {len(self.all_lab_rooms)} lab rooms"
            )
            warned.add(course)
        return list(self.all_lab_rooms)
