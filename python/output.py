"""
STEP 6 — Extract & save.

Turns the solved CP-SAT model into the timetable representation shown to
users: raw solver rows (extract_solution), the display schedule shared by
both the Excel export and the Flask/website response (build_display_schedule
— see ct.py for the CT placeholder rows it adds), and the multi-sheet Excel
workbook (save_timetable).
"""

import re

import pandas as pd

from .config import CT_MATRIX
from .ct import _build_ct_batches_by_day
from .utils import _batch_to_academic_division


class OutputMixin:
    """Solution-extraction / export instance methods, mixed into TimetableScheduler."""

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

    def save_timetable(self, solution: list[dict], out: str):
        unscheduled = [
            s for s in self.sessions if self.solver.Value(s["placed_var"]) == 0
        ]
        unscheduled_rows = [
            {
                "Faculty": s["faculty"],
                "Course": s["course"],
                "Div/Batch": s["label"],
                "Type": s["type"],
                "Entity": s["entity"],
            }
            for s in sorted(
                unscheduled, key=lambda x: (x["type"], x["faculty"], x["course"])
            )
        ]

        print(f"\nSaving → {out}")
        df = pd.DataFrame(solution)
        if df.empty:
            print("  ✗ Nothing to save in main timetable.")
            if unscheduled_rows:
                df_uns = pd.DataFrame(unscheduled_rows)
                with pd.ExcelWriter(out, engine="openpyxl") as w:
                    df_uns.to_excel(w, sheet_name="Unscheduled", index=False)
                print(
                    f"  ✓ Unscheduled report saved ({len(unscheduled_rows)} sessions)."
                )
            return

        day_ord = {d: i for i, d in enumerate(self.days)}

        def srt(sub):
            s = sub.copy()
            s["_o"] = s["Day"].map(day_ord)
            return s.sort_values(["_o", "Time"]).drop(columns=["_o"])

        # ── Build CT Allocation DataFrame directly from CT_MATRIX ────────
        ct_batches_by_day = _build_ct_batches_by_day()

        ct_rows = []
        for day_idx in sorted(self.ct_allocation.keys()):
            day_name = (
                self.days[day_idx] if day_idx < len(self.days) else f"Day{day_idx}"
            )
            for div in self.ct_allocation.get(day_idx, []):
                ct_rows.append(
                    {
                        "CT Day": day_name,
                        "Day Index": day_idx,
                        "Division": div,
                        "Active CT Batches": "  ".join(
                            ct_batches_by_day.get(day_idx, [])
                        ),
                    }
                )
        df_ct = (
            pd.DataFrame(ct_rows)
            if ct_rows
            else pd.DataFrame(
                columns=["CT Day", "Day Index", "Division", "Active CT Batches"]
            )
        )

        # ── CT-DISP: single canonical display schedule ──────────────────────
        #
        # build_display_schedule() is the one place that adds the generic
        # "CT" placeholder rows (Course/Type "CT", no Faculty, no Room) for
        # every FY division in CT_MATRIX — the same rows previously built
        # inline here twice (once for Overview, once per E_* sheet). It is
        # also what generate_timetable() now calls for the Flask/website
        # response, so Excel and the website always render identical data.
        # This does NOT remove or alter any existing row: actual CT track
        # sessions (e.g. faculty/room detail for batch "AI11") keep
        # appearing exactly as before; we are only adding the missing
        # division-level "CT" rows so divisions are never silently absent
        # from Overview / their own sheet during their own CT window.
        df_overview = pd.DataFrame(self.build_display_schedule(solution))
        # ─────────────────────────────────────────────────────────────────

        with pd.ExcelWriter(out, engine="openpyxl") as w:
            df_overview.to_excel(w, sheet_name="Overview", index=False)
            df_ct.to_excel(w, sheet_name="CT Allocation", index=False)

            # ── CT Timetable sheet — separate institutional CT detail sheet.
            #
            # Contains one row per CT batch session (Course == "CT") from the
            # solver output, which already carries the real faculty and dedicated
            # room assigned by the solver.  Division names are intentionally
            # excluded — this sheet is track-level only.
            #
            # Columns: Day | Time | CT Track / Batch | Faculty | Room / Laboratory
            #
            # The division (E_*) sheets show only "CT" with no faculty/room/track.
            # Faculty (F_*) and Room (R_*) sheets continue to show full CT detail
            # because the underlying solver rows are unchanged.
            ct_sched_mask = df["Course"].astype(str).str.strip().str.upper() == "CT"
            df_ct_sched_src = df[ct_sched_mask]
            df_ct_timetable = (
                df_ct_sched_src.rename(
                    columns={
                        "Div/Batch": "CT Track / Batch",
                        "Room": "Room / Laboratory",
                    }
                )[["Day", "Time", "CT Track / Batch", "Faculty", "Room / Laboratory"]]
                .pipe(lambda s: s.assign(_o=s["Day"].map(day_ord)))
                .sort_values(["_o", "Time", "CT Track / Batch"])
                .drop(columns=["_o"])
                .reset_index(drop=True)
            )
            df_ct_timetable.to_excel(w, sheet_name="CT Timetable", index=False)

            if unscheduled_rows:
                pd.DataFrame(unscheduled_rows).to_excel(
                    w, sheet_name="Unscheduled", index=False
                )

            for fac in sorted(df["Faculty"].unique()):
                srt(df[df["Faculty"] == fac]).to_excel(
                    w, sheet_name=f"F_{fac}"[:31], index=False
                )

            # ── CT-DISP: include FY divisions even if they have zero
            # non-CT sessions of their own, so their CT-only day still gets
            # a division sheet.
            div_labels = sorted(
                (set(l for l in df["Division"].unique() if l != "—"))
                | set(CT_MATRIX.keys())
            )
            for lbl in div_labels:
                safe_lbl = re.sub(r"[\\/*?:\[\]]", "_", lbl)
                # df_overview already contains this division's CT placeholder
                # rows (from build_display_schedule), so no separate
                # concat is needed here anymore.
                sub = df_overview[df_overview["Division"] == lbl]
                if sub.empty:
                    continue
                srt(sub).to_excel(w, sheet_name=f"E_{safe_lbl}"[:31], index=False)

            for room in sorted(r for r in df["Room"].unique() if r):
                srt(df[df["Room"] == room]).to_excel(
                    w, sheet_name=f"R_{room}"[:31], index=False
                )

        n = (
            1  # Overview
            + 1  # CT Allocation
            + 1  # CT Timetable
            + (1 if unscheduled_rows else 0)
            + df["Faculty"].nunique()
            + len(div_labels)
            + df["Room"].nunique()
        )
        print(
            f"  ✓ {n} sheets saved  "
            f"({len(unscheduled_rows)} unscheduled sessions in 'Unscheduled' sheet)"
        )
        print("\n" + "─" * 95)
        print(df.head(30).to_string(index=False))
        if len(df) > 30:
            print(f"  … {len(df)-30} more rows")
