"""STEP 4b — Greedy warm-start hints.

Slots are tried in sorted (earliest-first) order, consistent with the
SELECT_MIN_VALUE decision strategy. This maximises density of the initial
incumbent so LNS has the best possible starting point.
"""

from collections import defaultdict


class HintsMixin:
    def _add_solution_hints(self):
        lab_starts_sorted = sorted(set(self.allowed_lab_starts))
        theory_starts_sorted = sorted(set(self.allowed_theory_starts))

        slot_room_used: dict[int, set] = defaultdict(set)
        faculty_used: dict[str, set] = defaultdict(set)
        entity_used: dict[str, set] = defaultdict(set)

        def _slots_free(fac, entity, g, dur):
            for d in range(dur):
                if (g + d) in faculty_used[fac]:
                    return False
                if (g + d) in entity_used[entity]:
                    return False
            return True

        order = {"Lab": 0, "Tutorial": 1, "Theory": 2}
        sessions_sorted = sorted(
            self.sessions, key=lambda s: (order[s["type"]], s["id"])
        )

        room_total_demand: dict[str, int] = defaultdict(int)
        for sess in self.sessions:
            if sess["type"] == "Lab":
                for r in sess["rooms"]:
                    room_total_demand[r] += 1
        lab_cap_per_room = 4 * len(self.days)

        def _pool_utilisation(rooms):
            if not rooms:
                return 0.0
            total_demand = sum(room_total_demand[r] for r in rooms)
            total_cap = len(rooms) * lab_cap_per_room
            return total_demand / total_cap if total_cap > 0 else 1.0

        HINT_UTIL_THRESHOLD = 0.85
        hints_set = 0

        # ── Iterative-repair: seed occupancy from frozen sessions ─────────
        # Frozen sessions already have a fixed start/room; mark those slots
        # as used so greedy hints for the remaining flexible sessions don't
        # propose colliding placements (the solver would reject them anyway
        # via NoOverlap, but seeding keeps hints internally consistent).
        for sess in self.sessions:
            frozen = sess.get("_frozen")
            if frozen is None:
                continue
            g0 = frozen["start"]
            room0 = frozen["room"]
            dur0 = sess["duration"]
            for d in range(dur0):
                if room0 != "ONLINE":
                    slot_room_used[g0 + d].add(room0)
                faculty_used[sess["faculty"]].add(g0 + d)
                entity_used[sess["entity"]].add(g0 + d)

        for sess in sessions_sorted:
            sid = sess["id"]
            dur = sess["duration"]
            fac = sess["faculty"]
            entity = sess["entity"]
            starts = (
                lab_starts_sorted if sess["type"] == "Lab" else theory_starts_sorted
            )

            # Skip greedy hinting for already-frozen sessions — their
            # start/placed/room are pinned via hard constraints above.
            if sess.get("_frozen") is not None:
                continue

            # Skip hints for over-subscribed room pools
            if (
                sess["type"] == "Lab"
                and _pool_utilisation(sess["rooms"]) > HINT_UTIL_THRESHOLD
            ):
                continue

            placed = False
            for g in starts:
                if dur == 2:
                    day_g = g // self.time_slots_per_day
                    day_g2 = (g + 1) // self.time_slots_per_day
                    if day_g != day_g2:
                        continue
                if not _slots_free(fac, entity, g, dur):
                    continue
                chosen_room = None
                for rname in sess["rooms"]:
                    ok = all(
                        (g + d) not in slot_room_used
                        or rname not in slot_room_used[g + d]
                        for d in range(dur)
                    )
                    if ok:
                        chosen_room = rname
                        break
                if chosen_room is None:
                    continue

                self.model.AddHint(self.session_starts[sid], g)
                self.model.AddHint(sess["placed_var"], 1)
                for rname2, bv in self.session_room_bools[sid].items():
                    self.model.AddHint(bv, 1 if rname2 == chosen_room else 0)
                for d in range(dur):
                    slot_room_used[g + d].add(chosen_room)
                    faculty_used[fac].add(g + d)
                    entity_used[entity].add(g + d)
                hints_set += 1
                placed = True
                break

            if not placed:
                self.model.AddHint(sess["placed_var"], 0)
                for bv in self.session_room_bools[sid].values():
                    self.model.AddHint(bv, 0)

        print(
            f"  ✓ Warm-start hints: {hints_set}/{len(self.sessions)} sessions pre-placed"
            f"  [earliest-first slot ordering — maximise density]"
        )
