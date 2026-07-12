"""Per-session CP-SAT variable creation — the core of build_model().

For every session: an optional interval (start/end/placed), a room boolean
per candidate room plus an ONLINE boolean, the online/offline domain
coupling, the iterative-repair freeze hooks, and the CT pin hook. Also
collects the interval lists (per faculty/room/division/batch) that
constraints.py turns into NoOverlap constraints, and the per-type start-var
lists constraints.py uses for decision strategies.
"""

import re
from collections import defaultdict

from ortools.sat.python import cp_model

from ..config import DIVISION_TO_BATCHES, ONLINE_PENALTY, SESSION_WEIGHTS


class SessionVariablesMixin:
    def _create_session_variables(self, theory_dom, lab_dom, max_g, ct_global_per_day):
        room_opt_ivls: dict[str, list] = defaultdict(list)
        faculty_ivls: dict[str, list] = defaultdict(list)
        division_ivls: dict[str, list] = defaultdict(list)
        batch_ivls: dict[str, list] = defaultdict(list)
        div_batch_ivls: dict[tuple, list] = defaultdict(list)

        # Separated start-var lists for typed decision strategies (SELECT_MIN_VALUE).
        # Labs first (most constrained), then Tutorials, then Theory.
        lab_start_vars: list[cp_model.IntVar] = []
        tutorial_start_vars: list[cp_model.IntVar] = []
        theory_start_vars: list[cp_model.IntVar] = []

        # Symmetry breaking groups
        clone_groups: dict[tuple, list[cp_model.IntVar]] = defaultdict(list)

        # Objective terms: weighted placed booleans
        objective_terms: list = []

        # Per-session online penalty terms (ported from final.py)
        online_penalty_terms: list = []

        total_opt = 0

        for sess in self.sessions:
            sid = sess["id"]
            dur = sess["duration"]
            entity = sess["entity"]
            can_online = sess["can_online"]
            stype = sess["type"]

            start = self.model.NewIntVarFromDomain(
                lab_dom if stype == "Lab" else theory_dom, f"s{sid}_st"
            )
            end = self.model.NewIntVar(0, max_g + dur, f"s{sid}_en")

            placed = self.model.NewBoolVar(f"placed_{sid}")

            ivl = self.model.NewOptionalIntervalVar(
                start, dur, end, placed, f"s{sid}_iv"
            )

            self.session_starts[sid] = start
            self.session_ends[sid] = end
            self.session_intervals[sid] = ivl
            sess["placed_var"] = placed

            # ── Iterative-repair freeze hook ──────────────────────────────
            # If this session was scheduled in a previous repair pass, pin
            # placed=1 and start=assigned_start. This does not alter any
            # constraint — it only narrows these two vars to a single value,
            # so every existing NoOverlap / CT / objective term still applies
            # exactly as before, just with a fixed domain for frozen sessions.
            frozen = sess.get("_frozen")
            if frozen is not None:
                self.model.Add(placed == 1)
                self.model.Add(start == frozen["start"])

            # CT-P: pin CT batch sessions to exactly the 15:10 slot on their
            # FY division's CT day — see schedulers/ct/model_pins.py.
            self._pin_ct_batch_session(sess, start, placed, frozen, ct_global_per_day)

            if stype == "Lab":
                lab_start_vars.append(start)
            elif stype == "Tutorial":
                tutorial_start_vars.append(start)
            else:
                theory_start_vars.append(start)

            clone_key = (sess["faculty"], sess["course"], sess["entity"], stype)
            clone_groups[clone_key].append(start)

            faculty_ivls[sess["faculty"]].append(ivl)
            if sess["etype"] == "division":
                division_ivls[entity].append(ivl)
            else:
                batch_ivls[entity].append(ivl)

            div_family = sess.get("div_family")
            if div_family:
                if sess["etype"] == "division":
                    for child in DIVISION_TO_BATCHES.get(div_family, []):
                        div_batch_ivls[(div_family, child)].append(ivl)
                else:
                    div_batch_ivls[(div_family, entity)].append(ivl)

            # ── Room booleans (C2 / C10 / C11) ───────────────────────────
            room_bools: list[cp_model.BoolVar] = []
            for rname in sess["rooms"]:
                rn = re.sub(r"[^A-Za-z0-9]", "_", rname)
                bv = self.model.NewBoolVar(f"s{sid}_r{rn}")
                oi = self.model.NewOptionalIntervalVar(
                    start, dur, end, bv, f"s{sid}_i{rn}"
                )
                room_opt_ivls[rname].append(oi)
                self.session_room_bools[sid][rname] = bv
                room_bools.append(bv)
                total_opt += 1

            online_bv = self.model.NewBoolVar(f"s{sid}_ONL")
            self.session_room_bools[sid]["ONLINE"] = online_bv
            room_bools.append(online_bv)

            # Soft penalty: discourage online delivery (ported from final.py)
            online_penalty_terms.append(ONLINE_PENALTY * online_bv)

            # C11: exactly one room iff placed
            self.model.Add(sum(room_bools) == placed)

            # ── Iterative-repair freeze hook (room) ───────────────────────
            # Pin the room boolean that was assigned in a previous pass to 1
            # and all others to 0. The C11 constraint above (exactly one
            # room iff placed) is untouched; this just fixes which boolean
            # satisfies it for frozen sessions.
            if frozen is not None:
                frozen_room = frozen["room"]
                for rname2, bv2 in self.session_room_bools[sid].items():
                    self.model.Add(bv2 == (1 if rname2 == frozen_room else 0))

            # C8/C9: online coupling
            if not can_online:
                self.model.Add(online_bv == 0).OnlyEnforceIf(placed)
                self.model.Add(online_bv == 0).OnlyEnforceIf(placed.Not())

            elif self.online_global and self.offline_global:
                online_list = sorted(
                    self.online_global & set(self.allowed_theory_starts)
                )
                offline_list = sorted(
                    self.offline_global & set(self.allowed_theory_starts)
                )

                if online_list and offline_list:
                    self.model.AddLinearExpressionInDomain(
                        start, cp_model.Domain.FromValues(online_list)
                    ).OnlyEnforceIf(online_bv)
                    self.model.AddLinearExpressionInDomain(
                        start, cp_model.Domain.FromValues(offline_list)
                    ).OnlyEnforceIf(online_bv.Not())
                    for rname, bv in self.session_room_bools[sid].items():
                        if rname != "ONLINE":
                            self.model.AddImplication(online_bv, bv.Not())
                    self.model.Add(online_bv == 0).OnlyEnforceIf(placed.Not())

                elif not online_list:
                    self.model.Add(online_bv == 0).OnlyEnforceIf(placed)
                    self.model.Add(online_bv == 0).OnlyEnforceIf(placed.Not())
                else:
                    self.model.Add(online_bv == 1).OnlyEnforceIf(placed)
                    self.model.Add(online_bv == 0).OnlyEnforceIf(placed.Not())
            else:
                self.model.Add(online_bv == 0).OnlyEnforceIf(placed)
                self.model.Add(online_bv == 0).OnlyEnforceIf(placed.Not())

            weight = SESSION_WEIGHTS.get(stype, 1)
            objective_terms.append(weight * placed)

        print(
            f"  ✓ {len(self.sessions)} optional intervals, "
            f"{total_opt} opt-room intervals"
        )

        return {
            "room_opt_ivls": room_opt_ivls,
            "faculty_ivls": faculty_ivls,
            "division_ivls": division_ivls,
            "batch_ivls": batch_ivls,
            "div_batch_ivls": div_batch_ivls,
            "lab_start_vars": lab_start_vars,
            "tutorial_start_vars": tutorial_start_vars,
            "theory_start_vars": theory_start_vars,
            "clone_groups": clone_groups,
            "objective_terms": objective_terms,
            "online_penalty_terms": online_penalty_terms,
            "total_opt": total_opt,
        }
