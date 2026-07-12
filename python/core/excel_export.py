"""STEP 6b — Save the solved timetable to a multi-sheet Excel workbook."""

import re

import pandas as pd

from ..config import CT_MATRIX
from ..schedulers.ct import _build_ct_batches_by_day


class ExcelExportMixin:
    """Excel-export instance methods, mixed into TimetableScheduler."""

    def _unscheduled_rows(self) -> list[dict]:
        unscheduled = [
            s for s in self.sessions if self.solver.Value(s["placed_var"]) == 0
        ]
        return [
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

    def _ct_allocation_rows(self) -> list[dict]:
        ct_batches_by_day = _build_ct_batches_by_day()
        rows = []
        for day_idx in sorted(self.ct_allocation.keys()):
            day_name = (
                self.days[day_idx] if day_idx < len(self.days) else f"Day{day_idx}"
            )
            for div in self.ct_allocation.get(day_idx, []):
                rows.append(
                    {
                        "CT Day": day_name,
                        "Day Index": day_idx,
                        "Division": div,
                        "Active CT Batches": "  ".join(
                            ct_batches_by_day.get(day_idx, [])
                        ),
                    }
                )
        return rows

    def save_timetable(self, solution: list[dict], out: str):
        unscheduled_rows = self._unscheduled_rows()

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

        ct_rows = self._ct_allocation_rows()
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
