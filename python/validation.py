"""Pre-solve feasibility checks and post-solve diagnostic reporting."""

from collections import Counter, defaultdict


class ValidationMixin:
    """Validation/reporting instance methods, mixed into TimetableScheduler."""

    # ──────────────────────────────────────────────────────────────
    # STEP 3 — Feasibility report
    # ──────────────────────────────────────────────────────────────
    def feasibility_report(self):
        print("\n[3/6] Feasibility pre-check …")
        n_off = sum(1 for v in self.online_days if v == 0)
        usable = self.time_slots_per_day - 1

        th_dem = sum(1 for s in self.sessions if s["type"] in ("Theory", "Tutorial"))
        lab_dem = sum(1 for s in self.sessions if s["type"] == "Lab")

        th_cap_off = len(self.theory_rooms) * usable * n_off
        th_cap_full = len(self.theory_rooms) * usable * len(self.days)
        lab_cap = len(self.all_lab_rooms) * 4 * len(self.days)

        print(f"  Theory/Tutorial demand  : {th_dem}")
        print(
            f"  Theory offline cap      : {th_cap_off}  "
            f"{'✓' if th_dem<=th_cap_off else f'⚠ overflow={th_dem-th_cap_off} → Saturday absorbs'}"
        )
        print(
            f"  Theory full cap (6 days): {th_cap_full}  "
            f"{'✓' if th_dem<=th_cap_full else '✗ OVER'}"
        )
        print(
            f"  Lab demand              : {lab_dem}  cap={lab_cap}  "
            f"{'✓' if lab_dem<=lab_cap else '✗ OVER'}"
        )

        fac: dict[str, int] = defaultdict(int)
        ent: dict[str, int] = defaultdict(int)
        for s in self.sessions:
            fac[s["faculty"]] += s["duration"]
            if not s["entity"].startswith("_"):
                ent[s["entity"]] += s["duration"]
        cap = usable * len(self.days)
        bad_f = [(f, c) for f, c in fac.items() if c > cap]
        bad_e = [(e, c) for e, c in ent.items() if c > cap]
        print(
            f"  {'✓ Faculty OK' if not bad_f else f'⚠ Overloaded faculty: {bad_f[:5]}'} "
            f"(max {cap} slots/week)"
        )
        print(
            f"  {'✓ Entities OK' if not bad_e else f'⚠ Overloaded entities: {bad_e[:5]}'}"
        )

        print("\n  Per-lab-type utilisation:")
        lab_demand_by_subject: dict[str, int] = defaultdict(int)
        for s in self.sessions:
            if s["type"] == "Lab":
                rooms = s["rooms"]
                matched_subj = "ALL (no dedicated lab)"
                for subj, srooms in self.subject_lab_rooms.items():
                    if set(rooms) == set(srooms) or set(rooms).issubset(set(srooms)):
                        matched_subj = subj
                        break
                lab_demand_by_subject[matched_subj] += 1

        for subj, dem in sorted(lab_demand_by_subject.items()):
            if subj == "ALL (no dedicated lab)":
                cap_s = len(self.all_lab_rooms) * 4 * len(self.days)
                status = "✓" if dem <= cap_s else "✗ OVER"
                print(f"    {subj}: {dem} / {cap_s} = {dem/cap_s*100:.0f}%  {status}")
            else:
                srooms = self.subject_lab_rooms.get(subj, [])
                cap_s = len(srooms) * 4 * len(self.days)
                status = "✓" if dem <= cap_s else "✗ OVER"
                print(f"    {subj}: {dem} / {cap_s} = {dem/cap_s*100:.0f}%  {status}")

        print("\n  === DETAILED LAB POOL BOTTLENECK ANALYSIS ===")
        pool_demand: dict[frozenset, list] = defaultdict(list)
        for s in self.sessions:
            if s["type"] == "Lab":
                pool_demand[frozenset(s["rooms"])].append(s["course"])

        for pool, courses in sorted(pool_demand.items(), key=lambda x: -len(x[1])):
            pool_list = sorted(pool)
            n_rooms = len(pool_list)
            n_sessions = len(courses)
            cap = n_rooms * 4 * len(self.days)
            util = n_sessions / cap * 100 if cap > 0 else float("inf")
            course_counts = Counter(courses)
            print(f"\n  Pool ({n_rooms} room(s)): {pool_list}")
            print(
                f"    Demand: {n_sessions}  Capacity: {cap}  Utilisation: {util:.0f}%"
            )
            print(f"    Courses: {dict(course_counts)}")

    # ──────────────────────────────────────────────────────────────
    # Diagnostic report — printed after solve
    # ──────────────────────────────────────────────────────────────
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
