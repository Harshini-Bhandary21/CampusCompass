"""
Theory-only soft constraints (ported from final.py).

Adds soft preferences for THEORY sessions only, returned as penalty terms
to be subtracted from the Maximize() objective in scheduler.py:build_model().
No hard constraint is modified here.

  (0) Same entity+course scheduled twice on same day → SAME_DAY_SAME_SUBJECT_PENALTY
  (1) Adjacent theory lectures of same entity, same subject → HIGH_THEORY_PENALTY
  (2) Paired theory slots for same entity placed in different rooms → HIGH_THEORY_PENALTY
  (3) Theory lecture in local slot 1 or 2 (early) → MEDIUM_THEORY_PENALTY
  (4) Theory lecture in local slot 10 or 11 (late) → LOW_THEORY_PENALTY
"""

from collections import defaultdict

from ortools.sat.python import cp_model

from .config import (
    HIGH_THEORY_PENALTY,
    LOW_THEORY_PENALTY,
    MEDIUM_THEORY_PENALTY,
    SAME_DAY_SAME_SUBJECT_PENALTY,
    THEORY_EARLY_SLOTS,
    THEORY_LATE_SLOTS,
    THEORY_PAIRED_SLOT_STARTS,
)


class TheoryMixin:
    """Theory-specific instance methods, mixed into TimetableScheduler."""

    def _add_theory_soft_constraints(self) -> list:
        penalty_terms: list = []

        theory_sessions = [s for s in self.sessions if s["type"] == "Theory"]
        if not theory_sessions:
            print("  ℹ Theory soft constraints: no Theory sessions found, skipping")
            return penalty_terms

        tspd = self.time_slots_per_day
        lunch = self.lunch_slot

        # ── Constant id maps (NOT model variables) ───────────────────────
        course_to_id: dict[str, int] = {}
        for s in theory_sessions:
            course_to_id.setdefault(s["course"], len(course_to_id))
        max_course_id = max(course_to_id.values(), default=0)

        room_names = list(self.theory_rooms) + ["ONLINE"]
        room_to_id: dict[str, int] = {r: i for i, r in enumerate(room_names)}
        n_rooms = len(room_names)

        # ── Helper bool: is_at[sid][g] ⟺ (session sid is placed AND starts
        #    exactly at global slot g) — built once per theory session over
        #    every valid theory slot.
        is_at: dict[int, dict[int, cp_model.BoolVar]] = defaultdict(dict)
        for s in theory_sessions:
            sid = s["id"]
            start_v = self.session_starts[sid]
            placed_v = s["placed_var"]
            for g in self.allowed_theory_starts:
                bv = self.model.NewBoolVar(f"th_at_{sid}_{g}")
                self.model.AddImplication(bv, placed_v)
                self.model.Add(start_v == g).OnlyEnforceIf(bv)
                self.model.Add(start_v != g).OnlyEnforceIf([bv.Not(), placed_v])
                is_at[sid][g] = bv

        # ── Per-session constant-weighted room-id sum (one IntVar/session)
        roomid_sum: dict[int, cp_model.IntVar] = {}
        for s in theory_sessions:
            sid = s["id"]
            rv = self.model.NewIntVar(0, n_rooms, f"th_roomid_{sid}")
            terms = [
                (room_to_id[rname] + 1) * bv
                for rname, bv in self.session_room_bools[sid].items()
                if rname in room_to_id
            ]
            self.model.Add(rv == sum(terms)) if terms else self.model.Add(rv == 0)
            roomid_sum[sid] = rv

        # ── Group theory sessions by owning entity (division/batch) ─────
        entity_sessions: dict[str, list[dict]] = defaultdict(list)
        for s in theory_sessions:
            entity_sessions[s["entity"]].append(s)

        # ── Per (entity, g): occupancy bool / course-id var / room-id var ─
        occ: dict[tuple, cp_model.BoolVar] = {}
        course_var: dict[tuple, cp_model.IntVar] = {}
        roomvar_at: dict[tuple, cp_model.IntVar] = {}

        for entity, sess_list in entity_sessions.items():
            sids = [s["id"] for s in sess_list]
            for g in self.allowed_theory_starts:
                bvs = [is_at[sid][g] for sid in sids]

                occ_bv = self.model.NewBoolVar(f"occ_{entity}_{g}")
                self.model.Add(occ_bv == sum(bvs))
                occ[(entity, g)] = occ_bv

                cvar = self.model.NewIntVar(-1, max_course_id, f"cvar_{entity}_{g}")
                cterms = [
                    (course_to_id[s["course"]] + 1) * is_at[s["id"]][g]
                    for s in sess_list
                ]
                self.model.Add(cvar == sum(cterms) - 1)
                course_var[(entity, g)] = cvar

                rvar = self.model.NewIntVar(0, n_rooms, f"rvar_{entity}_{g}")
                y_terms = []
                for sid in sids:
                    b = is_at[sid][g]
                    y = self.model.NewIntVar(0, n_rooms, f"y_{sid}_{g}")
                    self.model.Add(y <= roomid_sum[sid])
                    self.model.Add(y <= n_rooms * b)
                    self.model.Add(y >= roomid_sum[sid] - n_rooms * (1 - b))
                    y_terms.append(y)
                self.model.Add(rvar == sum(y_terms))
                roomvar_at[(entity, g)] = rvar

        # ── Adjacent global-slot pairs within the same day ───────────────
        def _adjacent_pairs(slot_filter=None):
            pairs = []
            for day in range(len(self.days)):
                for s1 in sorted(self.time_slots):
                    s2 = s1 + 1
                    if s2 not in self.time_slots:
                        continue
                    if s1 == lunch or s2 == lunch:
                        continue
                    if slot_filter is not None and s1 not in slot_filter:
                        continue
                    g1 = day * tspd + (s1 - 1)
                    g2 = day * tspd + (s2 - 1)
                    if (
                        g1 in self.allowed_theory_starts
                        and g2 in self.allowed_theory_starts
                    ):
                        pairs.append((g1, g2))
            return pairs

        # ═══ Rule (0): same entity+course, same day, >= 2 times → penalty ═══
        r0 = 0
        for entity, sess_list in entity_sessions.items():
            by_course: dict[str, list] = defaultdict(list)
            for s in sess_list:
                by_course[s["course"]].append(s)

            for course, c_sessions in by_course.items():
                if len(c_sessions) < 2:
                    continue
                sids = [s["id"] for s in c_sessions]

                for day in range(len(self.days)):
                    day_globals = [
                        g
                        for g in self.allowed_theory_starts
                        if self.global_to_day_slot[g][0] == day
                    ]
                    if not day_globals:
                        continue

                    bvs = [is_at[sid][g] for sid in sids for g in day_globals]
                    if not bvs:
                        continue

                    count_var = self.model.NewIntVar(
                        0, len(bvs), f"sdsj_count_{entity}_{course}_{day}"
                    )
                    self.model.Add(count_var == sum(bvs))

                    violation = self.model.NewBoolVar(
                        f"sdsj_viol_{entity}_{course}_{day}"
                    )
                    self.model.Add(count_var >= 2).OnlyEnforceIf(violation)
                    self.model.Add(count_var <= 1).OnlyEnforceIf(violation.Not())

                    penalty_terms.append(SAME_DAY_SAME_SUBJECT_PENALTY * violation)
                    r0 += 1

        # ═══ Rule (1): adjacent theory lectures, same entity, same subject → HIGH penalty ═══
        all_adj_pairs = _adjacent_pairs()
        r1 = 0
        for entity in entity_sessions:
            for g1, g2 in all_adj_pairs:
                o1, o2 = occ[(entity, g1)], occ[(entity, g2)]
                cv1, cv2 = course_var[(entity, g1)], course_var[(entity, g2)]

                same_course = self.model.NewBoolVar(f"samecourse_{entity}_{g1}_{g2}")
                self.model.Add(cv1 == cv2).OnlyEnforceIf(same_course)
                self.model.Add(cv1 != cv2).OnlyEnforceIf(same_course.Not())

                violation = self.model.NewBoolVar(f"viol_subj_{entity}_{g1}_{g2}")
                self.model.AddBoolAnd([o1, o2, same_course]).OnlyEnforceIf(violation)
                self.model.AddBoolOr(
                    [o1.Not(), o2.Not(), same_course.Not()]
                ).OnlyEnforceIf(violation.Not())

                penalty_terms.append(HIGH_THEORY_PENALTY * violation)
                r1 += 1

        # ═══ Rule (2): paired theory slots, same entity, different rooms → HIGH penalty ═══
        paired_pairs = _adjacent_pairs(slot_filter=set(THEORY_PAIRED_SLOT_STARTS))
        r2 = 0
        for entity in entity_sessions:
            for g1, g2 in paired_pairs:
                o1, o2 = occ[(entity, g1)], occ[(entity, g2)]
                rv1, rv2 = roomvar_at[(entity, g1)], roomvar_at[(entity, g2)]

                same_room = self.model.NewBoolVar(f"sameroom_{entity}_{g1}_{g2}")
                self.model.Add(rv1 == rv2).OnlyEnforceIf(same_room)
                self.model.Add(rv1 != rv2).OnlyEnforceIf(same_room.Not())

                violation = self.model.NewBoolVar(f"viol_room_{entity}_{g1}_{g2}")
                self.model.AddBoolAnd([o1, o2, same_room.Not()]).OnlyEnforceIf(
                    violation
                )
                self.model.AddBoolOr([o1.Not(), o2.Not(), same_room]).OnlyEnforceIf(
                    violation.Not()
                )

                penalty_terms.append(HIGH_THEORY_PENALTY * violation)
                r2 += 1

        # ═══ Rules (3) / (4): early-slot / late-slot theory penalties ═══
        all_theory_dom_set = set(self.allowed_theory_starts)
        r3 = r4 = 0
        for s in theory_sessions:
            sid = s["id"]
            start_v = self.session_starts[sid]
            placed_v = s["placed_var"]

            early_globals = [
                g
                for g in self.allowed_theory_starts
                if self.global_to_day_slot[g][1] in THEORY_EARLY_SLOTS
            ]
            late_globals = [
                g
                for g in self.allowed_theory_starts
                if self.global_to_day_slot[g][1] in THEORY_LATE_SLOTS
            ]

            if early_globals:
                early_bool = self.model.NewBoolVar(f"early_{sid}")
                early_dom = cp_model.Domain.FromValues(early_globals)
                rest_dom = cp_model.Domain.FromValues(
                    sorted(all_theory_dom_set - set(early_globals))
                )
                self.model.AddImplication(early_bool, placed_v)
                self.model.AddLinearExpressionInDomain(
                    start_v, early_dom
                ).OnlyEnforceIf(early_bool)
                if rest_dom.size() > 0:
                    self.model.AddLinearExpressionInDomain(
                        start_v, rest_dom
                    ).OnlyEnforceIf([early_bool.Not(), placed_v])
                penalty_terms.append(MEDIUM_THEORY_PENALTY * early_bool)
                r3 += 1

            if late_globals:
                late_bool = self.model.NewBoolVar(f"late_{sid}")
                late_dom = cp_model.Domain.FromValues(late_globals)
                rest_dom = cp_model.Domain.FromValues(
                    sorted(all_theory_dom_set - set(late_globals))
                )
                self.model.AddImplication(late_bool, placed_v)
                self.model.AddLinearExpressionInDomain(start_v, late_dom).OnlyEnforceIf(
                    late_bool
                )
                if rest_dom.size() > 0:
                    self.model.AddLinearExpressionInDomain(
                        start_v, rest_dom
                    ).OnlyEnforceIf([late_bool.Not(), placed_v])
                penalty_terms.append(LOW_THEORY_PENALTY * late_bool)
                r4 += 1

        print(
            f"  ✓ Theory soft constraints: "
            f"same-day-same-subject={r0}, "
            f"subject-adjacency={r1}, room-pairing={r2}, "
            f"early-slot={r3}, late-slot={r4}"
        )
        return penalty_terms
