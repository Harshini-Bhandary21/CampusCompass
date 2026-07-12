"""STEP 6a — Extract & build the display schedule.

Turns the solved CP-SAT model into the timetable representation shown to
users: raw solver rows (extract_solution), and the display schedule shared
by both the Excel export (excel_export.py) and the Flask/website response
(build_display_schedule — see schedulers/ct/allocation.py for the CT
placeholder rows it adds).
"""

from ..utils import _batch_to_academic_division
from ..config import CT_MATRIX


class OutputMixin:
    """Solution-extraction instance methods, mixed into TimetableScheduler."""

    def extract_solution(self) -> list[dict]:
        print("\n[6/6] Extracting …")
        rows = []
        for sess in self.sessions:
            if self.solver.Value(sess["placed_var"]) == 0:
                continue
            sid = sess["id"]
            dur = sess["duration"]
            g = self.solver.Value(self.session_starts[sid])
            day, slot = self.global_to_day_slot[g]

            t1 = self.time_slots[slot].split("-")[0].strip()
            if dur == 2 and (slot + 1) in self.time_slots:
                t2 = self.time_slots[slot + 1].split("-")[1].strip()
            else:
                t2 = self.time_slots[slot].split("-")[1].strip()
                if dur == 2:
                    print(
                        f"  ⚠ WARNING: lab s{sid} at slot {slot} "
                        f"— slot {slot+1} missing"
                    )
            time_str = f"{t1}–{t2}"

            room = next(
                (
                    rn
                    for rn, bv in self.session_room_bools[sid].items()
                    if self.solver.Value(bv)
                ),
                "UNASSIGNED",
            )

            rows.append(
                {
                    "Day": self.days[day],
                    "Time": time_str,
                    "Faculty": sess["faculty"],
                    "Course": sess["course"],
                    "Div/Batch": sess["label"],
                    "Division": _batch_to_academic_division(sess["label"]),
                    "Type": sess["type"],
                    "Room": room,
                    "_day": day,
                    "_slot": slot,
                }
            )

        rows.sort(key=lambda r: (r["_day"], r["_slot"], r["Div/Batch"]))
        for r in rows:
            del r["_day"], r["_slot"]
        print(f"  ✓ {len(rows)} sessions placed")
        return rows

    def _sort_display_rows(self, rows: list[dict]) -> list[dict]:
        """Sort rows by day order then time label — same ordering save_timetable
        has always used (day_ord + Time), just applied to a list of dicts
        instead of a DataFrame so it works equally well for the Flask response.
        """
        day_ord = {d: i for i, d in enumerate(self.days)}
        return sorted(
            rows,
            key=lambda r: (day_ord.get(r.get("Day"), len(self.days)), r.get("Time", "")),
        )

    def build_display_schedule(self, solution: list[dict]) -> list[dict]:
        """Single source of truth for the timetable shown to users.

        Takes the raw solver output (extract_solution() rows) and returns
        the exact processed representation previously built *only* inside
        save_timetable() for the Excel Overview / per-division sheets:
        every scheduled session, plus the generic CT placeholder rows for
        each FY division in CT_MATRIX, sorted by Day then Time.

        save_timetable() (Excel) and generate_timetable() (Flask API /
        MongoDB payload) both call this function, so the website and the
        Excel file always render identical data. All existing fields
        (Day, Time, Faculty, Course, Room, Type, Div/Batch, Division) are
        preserved as-is; nothing is removed or renamed.
        """
        display_rows = [dict(r) for r in solution]  # copy — never mutate solution
        for div in CT_MATRIX:
            display_rows.extend(self._ct_placeholder_rows(div))
        return self._sort_display_rows(display_rows)
