"""Pre-solve feasibility checks."""

from collections import Counter, defaultdict


class ValidationMixin:
    """Feasibility-check instance methods, mixed into TimetableScheduler."""

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
