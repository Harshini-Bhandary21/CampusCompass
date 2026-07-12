"""Post-solve diagnostic reporting — printed after every solve() call."""

from collections import Counter


class DiagnosticsMixin:
    """Post-solve diagnostic instance methods, mixed into TimetableScheduler."""

    def _print_diagnostic_report(self):
        scheduled = [
            s for s in self.sessions if self.solver.Value(s["placed_var"]) == 1
        ]
        unscheduled = [
            s for s in self.sessions if self.solver.Value(s["placed_var"]) == 0
        ]

        total = len(self.sessions)
        n_sch = len(scheduled)
        n_uns = len(unscheduled)

        print("\n" + "=" * 70)
        print(f"  SCHEDULED   : {n_sch:4d} / {total}  ({n_sch/total*100:.1f}%)")
        print(f"  UNSCHEDULED : {n_uns:4d} / {total}  ({n_uns/total*100:.1f}%)")
        print("=" * 70)

        # ── CT-S: CT Allocation Report (console) — reads CT_MATRIX directly ──
        self._print_ct_allocation()
        # ─────────────────────────────────────────────────────────────────

        # ── Day-load distribution ─────────────────────────────────────────
        if self._day_load_vars:
            print("\n  Sessions per day:")
            loads = [self.solver.Value(v) for v in self._day_load_vars]
            max_l = max(loads) if loads else 1
            bar_scale = 40 / max(max_l, 1)
            for day_name, load in zip(self.days, loads):
                bar = "█" * int(load * bar_scale)
                print(f"    {day_name:<12} {load:4d}  {bar}")
            if self._imbalance_var is not None:
                imb = self.solver.Value(self._imbalance_var)
                ideal = n_sch / len(self.days) if self.days else 0
                print(
                    f"\n    Imbalance (max−min): {imb}  |  Ideal per day: {ideal:.1f}"
                )
            if self._dev_vars:
                total_dev = sum(self.solver.Value(v) for v in self._dev_vars)
                print(f"    Total deviation from avg: {total_dev}")
            print()

        if not unscheduled:
            print("  ✓ All sessions scheduled — complete timetable generated.")
            return

        # ── By session type ───────────────────────────────────────────────
        type_counts = Counter(s["type"] for s in unscheduled)
        print("\n  Unscheduled by type:")
        for t in ["Lab", "Tutorial", "Theory"]:
            if type_counts[t]:
                print(f"    {t:<10}: {type_counts[t]:4d}")

        # ── By faculty ────────────────────────────────────────────────────
        fac_counts = Counter(s["faculty"] for s in unscheduled)
        print(f"\n  Unscheduled by faculty ({len(fac_counts)} affected):")
        for fac, cnt in sorted(fac_counts.items(), key=lambda x: -x[1]):
            total_fac = sum(1 for s in self.sessions if s["faculty"] == fac)
            print(f"    {cnt:3d}/{total_fac:<3d}  {fac}")

        # ── By course / subject ───────────────────────────────────────────
        course_counts = Counter(s["course"] for s in unscheduled)
        print(f"\n  Unscheduled by course ({len(course_counts)} affected):")
        for course, cnt in sorted(course_counts.items(), key=lambda x: -x[1]):
            print(f"    {cnt:3d}  {course}")

        # ── By division / batch ───────────────────────────────────────────
        entity_counts = Counter(s["label"] for s in unscheduled)
        print(f"\n  Unscheduled by division/batch ({len(entity_counts)} affected):")
        for ent, cnt in sorted(entity_counts.items(), key=lambda x: (-x[1], x[0])):
            print(f"    {cnt:3d}  {ent}")

        # ── Full table ────────────────────────────────────────────────────
        print(f"\n  {'─'*118}")
        print(f"  {'Faculty':<30} {'Course':<40} {'Label':<12} {'Type':<10}")
        print(f"  {'─'*30} {'─'*40} {'─'*12} {'─'*10}")
        for s in sorted(
            unscheduled, key=lambda x: (x["type"], x["faculty"], x["course"])
        ):
            print(
                f"  {s['faculty']:<30} {s['course']:<40} "
                f"{s['label']:<12} {s['type']:<10}"
            )
        print(f"  {'─'*118}")
