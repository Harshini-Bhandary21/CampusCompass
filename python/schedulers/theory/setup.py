"""Shared per-session/per-entity helper variables for the theory soft
constraints in rules.py.

Builds the constant id maps (course/room -> int) and the CP-SAT booleans
that the rule methods combine: is_at[sid][g] (session placed at slot g),
occ[(entity, g)] (any session of entity occupies slot g), course_var /
roomvar_at (which course/room occupies (entity, g), as an IntVar so two
slots can be compared for equality).
"""

from collections import defaultdict

from ortools.sat.python import cp_model


class TheorySetupMixin:
    def _build_theory_helper_vars(self):
        theory_sessions = [s for s in self.sessions if s["type"] == "Theory"]
        if not theory_sessions:
            return None

        tspd = self.time_slots_per_day

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

        # ── Group theory sessions by faculty (for gap-minimisation) ──────
        faculty_sessions: dict[str, list[dict]] = defaultdict(list)
        for s in theory_sessions:
            faculty_sessions[s["faculty"]].append(s)

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

        # ── Per (faculty, g): occupancy bool — same "sum of is_at" pattern
        #    as occ above, just grouped by faculty instead of entity. Reuses
        #    the existing is_at booleans, so this is a cheap aggregation, not
        #    a new per-session variable. Used by the gap-minimisation rule.
        occ_fac: dict[tuple, cp_model.BoolVar] = {}
        for faculty, sess_list in faculty_sessions.items():
            sids = [s["id"] for s in sess_list]
            for g in self.allowed_theory_starts:
                bvs = [is_at[sid][g] for sid in sids]
                occ_bv = self.model.NewBoolVar(f"occfac_{faculty}_{g}")
                self.model.Add(occ_bv == sum(bvs))
                occ_fac[(faculty, g)] = occ_bv

        return {
            "theory_sessions": theory_sessions,
            "tspd": tspd,
            "is_at": is_at,
            "entity_sessions": entity_sessions,
            "faculty_sessions": faculty_sessions,
            "occ": occ,
            "occ_fac": occ_fac,
            "course_var": course_var,
            "roomvar_at": roomvar_at,
        }

    def _theory_adjacent_pairs(self, slot_filter=None):
        """Adjacent global-slot pairs within the same day (skipping lunch)."""
        tspd = self.time_slots_per_day
        lunch = self.lunch_slot
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
