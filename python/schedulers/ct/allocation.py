"""CT allocation reporting/display helpers (data-driven, no solver query).

Includes the display-schedule helpers (CT-DISP) that turn the raw solver
output into the generic "CT" placeholder rows shown to humans — the only
place that decides how CT looks in the Excel sheets / website payload.
"""

from ...config import CT_MATRIX
from .batch_loader import _build_ct_batches_by_day
from .matrix_lookup import get_ct_day


class CTAllocationMixin:
    """CT allocation / display-schedule instance methods, mixed into CTMixin."""

    @staticmethod
    def _build_ct_allocation_from_matrix() -> dict[int, list[str]]:
        """Build ct_allocation dict directly from CT_MATRIX.

        Returns a dict mapping day_index (0-based) → sorted list of divisions
        whose CT slot falls on that day.  Called once at __init__ time.
        """
        allocation: dict[int, list[str]] = {}
        for div, row in CT_MATRIX.items():
            try:
                day_idx = row.index(1)
            except ValueError:
                continue
            allocation.setdefault(day_idx, []).append(div)
        for day_idx in allocation:
            allocation[day_idx].sort()
        return allocation

    def _print_ct_allocation(self):
        """Print CT allocation table to console (from CT_MATRIX — no solver needed)."""
        ct_batches_by_day = _build_ct_batches_by_day()

        print("\n" + "=" * 60)
        print("  CT ALLOCATION  (15:10–16:50)  [source: CT_MATRIX]")
        print("=" * 60)

        # Print every day that has at least one division assigned in CT_MATRIX
        assigned_days = sorted(self.ct_allocation.keys())
        for day_idx in assigned_days:
            day_name = (
                self.days[day_idx] if day_idx < len(self.days) else f"Day{day_idx}"
            )
            divs = self.ct_allocation.get(day_idx, [])
            active_batches = ct_batches_by_day.get(day_idx, [])

            print(f"\n  ## {day_name.upper()}")
            print(f"  {'─' * 30}")
            print(f"  Divisions ({len(divs)}):")
            for div in divs:
                print(f"    {div}")
            if active_batches:
                print(f"  Active CT batches ({len(active_batches)}):")
                print("    " + "  ".join(active_batches))
            else:
                print("  Active CT batches: (none)")

        # Summary counts per day
        print(f"\n  Summary:")
        for day_idx in assigned_days:
            day_name = (
                self.days[day_idx] if day_idx < len(self.days) else f"Day{day_idx}"
            )
            cnt = len(self.ct_allocation.get(day_idx, []))
            bar = "█" * cnt
            print(f"    {day_name:<12} {cnt:3d}  {bar}")
        print("=" * 60)

    # ────────────────────────────────────────────────────────────────────
    #  Display-schedule helpers (CT-DISP)
    #
    #  These are part of the *only* place that decides how the raw solver
    #  output (extract_solution() rows) gets turned into the timetable
    #  representation that humans see — whether that's an Excel sheet or a
    #  JSON payload handed to Flask/MongoDB/the website.
    #
    #  They are pure post-processing over already-placed sessions: no
    #  solver state, constraint, or objective is touched, and nothing here
    #  can change which sessions get scheduled or how many are left
    #  unscheduled.
    # ────────────────────────────────────────────────────────────────────
    def _ct_slot_label(self, local_idx: int) -> str:
        """Format a local time-slot index as an en-dash 'HH:MM–HH:MM' label."""
        raw = self.time_slots.get(local_idx, "")
        parts = raw.split("-")
        if len(parts) == 2:
            return f"{parts[0].strip()}–{parts[1].strip()}"
        return raw

    def _ct_placeholder_rows(self, division: str) -> list[dict]:
        """Build the generic 'CT' placeholder rows shown for *division*.

        Division-level views (Excel E_* sheets, website division view) must
        show CT as a plain institution-wide block — Course/Type "CT", no
        Faculty, no Room — never the underlying CT track/faculty/room.
        Returns [] for anything not in CT_MATRIX (CT track groups, etc.),
        so it can never affect scheduling or the unscheduled count.
        """
        day_idx = get_ct_day(division)
        if day_idx is None or day_idx >= len(self.days):
            return []
        day_name = self.days[day_idx]
        ct_time1 = self._ct_slot_label(self.ct_fixed_slot)
        ct_time2 = self._ct_slot_label(self.ct_fixed_slot2)
        base = {
            "Faculty": "",
            "Course": "CT",
            "Div/Batch": division,
            "Division": division,
            "Type": "CT",
            "Room": "",
        }
        return [
            {"Day": day_name, "Time": ct_time1, **base},
            {"Day": day_name, "Time": ct_time2, **base},
        ]
