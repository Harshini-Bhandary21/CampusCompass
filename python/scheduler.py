"""
Timetable Scheduler — CP-SAT  (v16 — CT data-driven static matrix)

CT days are assigned via CT_MATRIX (static dict, not solver variables).
Objective: 4-level (P1 placement, P2 max−min imbalance, P3 deviation, P4 Saturday).
OR-Tools 9.15 API compatibility maintained.

TimetableScheduler is the core orchestrator: __init__, the time-domain
builder, build_model() (the CP-SAT model itself), the greedy warm-start
hints, and solve(). Everything type-specific (data loading, labs, theory,
CT, validation, iterative repair, output) lives in its own module and is
mixed in below — each of those files can be read on its own to understand
that piece of the algorithm.
"""

import re
import time
from collections import defaultdict

from ortools.sat.python import cp_model

from .config import (
    BALANCE_WEIGHT,
    DEV_WEIGHT,
    DIVISION_TO_BATCHES,
    ONLINE_PENALTY,
    SAT_LECTURE_PENALTY,
    SAT_PENALTY,
    SESSION_WEIGHTS,
)
from .ct import CTMixin
from .data_loader import DataLoaderMixin
from .labs import LabsMixin
from .output import OutputMixin
from .repair import RepairMixin
from .theory import TheoryMixin
from .validation import ValidationMixin


class TimetableScheduler(
    DataLoaderMixin,
    LabsMixin,
    TheoryMixin,
    CTMixin,
    ValidationMixin,
    RepairMixin,
    OutputMixin,
):
    def __init__(self):
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()

        self.faculty_df = self.room_df = self.time_df = None

        self.time_slots: dict[int, str] = {}
        self.time_slots_per_day = 9
        self.lunch_slot = 5

        self.days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        self.online_days: list[int] = [0, 0, 0, 0, 0, 1]

        self.theory_rooms: list[str] = []
        self.subject_lab_rooms: dict[str, list[str]] = {}
        self.all_lab_rooms: list[str] = []

        self.sessions: list[dict] = []

        self.session_starts: dict[int, cp_model.IntVar] = {}
        self.session_ends: dict[int, cp_model.IntVar] = {}
        self.session_intervals: dict[int, cp_model.IntervalVar] = {}
        self.session_room_bools: dict[int, dict] = defaultdict(dict)

        self.global_to_day_slot: dict[int, tuple] = {}
        self.allowed_theory_starts: list[int] = []
        self.allowed_lab_starts: list[int] = []
        self.online_global: set[int] = set()
        self.offline_global: set[int] = set()

        # Set by build_model; used in diagnostic report
        self._day_load_vars: list[cp_model.IntVar] = []
        self._imbalance_var: cp_model.IntVar | None = None
        self._dev_vars: list[cp_model.IntVar] = []

        # CT support: fixed slot set in load_data(); allocation from CT_MATRIX
        self.ct_fixed_slot: int = -1  # local slot index for 15:10 slot (1-based)
        self.ct_fixed_slot2: int = -1  # local slot index for 16:00 slot (1-based)
        self.ct_allocation: dict[int, list[str]] = (
            self._build_ct_allocation_from_matrix()
        )

    # ──────────────────────────────────────────────────────────────
    # Build time domains
    # ──────────────────────────────────────────────────────────────
    def _build_time_domains(self):
        for day in range(len(self.days)):
            for slot in sorted(self.time_slots):
                g = day * self.time_slots_per_day + (slot - 1)
                self.global_to_day_slot[g] = (day, slot)
                (
                    self.online_global if self.online_days[day] else self.offline_global
                ).add(g)

        self.allowed_theory_starts = [
            g for g, (_, s) in self.global_to_day_slot.items() if s != self.lunch_slot
        ]

        preferred = [1, 3, 6, 8, 10]
        for day in range(len(self.days)):
            for s in preferred:
                s2 = s + 1
                if (
                    s in self.time_slots
                    and s2 in self.time_slots
                    and s2 <= self.time_slots_per_day
                    and s != self.lunch_slot
                    and s2 != self.lunch_slot
                ):
                    self.allowed_lab_starts.append(
                        day * self.time_slots_per_day + (s - 1)
                    )

        if not self.allowed_lab_starts:
            for g, (_, s) in self.global_to_day_slot.items():
                s2 = s + 1
                if (
                    s2 in self.time_slots
                    and s2 <= self.time_slots_per_day
                    and s != self.lunch_slot
                    and s2 != self.lunch_slot
                ):
                    self.allowed_lab_starts.append(g)

    # ──────────────────────────────────────────────────────────────
    # STEP 4 — Build CP-SAT model
    # ──────────────────────────────────────────────────────────────
    def build_model(self) -> bool:
        print("\n[4/6] Building CP-SAT model …")
        t0 = time.time()
        self._build_time_domains()

        max_g = max(self.global_to_day_slot)
        theory_dom = cp_model.Domain.FromValues(sorted(set(self.allowed_theory_starts)))
        lab_dom = cp_model.Domain.FromValues(sorted(set(self.allowed_lab_starts)))

        online_str = [self.days[i] for i, v in enumerate(self.online_days) if v]
        print(
            f"  Online days (theory/tutorial only): {', '.join(online_str) or 'None'}"
        )

        # Interval lists for NoOverlap constraints (C1–C5, C12)
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

        # ── CT-P: Pre-compute CT global slot positions before session loop ──
        # (see ct.py:_build_ct_pin_slots — needed inside the loop to pin CT
        # batch sessions to their fixed 15:10 slot).
        _ct_global_per_day = self._build_ct_pin_slots()
        # ────────────────────────────────────────────────────────────────────

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
            # FY division's CT day — see ct.py:_pin_ct_batch_session.
            self._pin_ct_batch_session(sess, start, placed, frozen, _ct_global_per_day)

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

        # CT-R: block every other session of a CT-day division from the
        # 15:10/16:00 CT slots — see ct.py:_apply_ct_blocking.
        self._apply_ct_blocking()

        sym_count = 0
        for key, svars in clone_groups.items():
            if len(svars) > 1:
                for i in range(len(svars) - 1):
                    self.model.Add(svars[i] <= svars[i + 1])
                    sym_count += 1
        print(f"  ✓ Symmetry breaking: {sym_count} ordering constraints added")

        # ── C1: Faculty no-overlap ────────────────────────────────────────
        n1 = sum(1 for v in faculty_ivls.values() if len(v) > 1)
        print(f"  C1 Faculty no-overlap: {n1} groups")
        for ivls in faculty_ivls.values():
            if len(ivls) > 1:
                self.model.AddNoOverlap(ivls)

        # ── C2: Room no-overlap ───────────────────────────────────────────
        print(f"  C2 Room no-overlap: {len(room_opt_ivls)} rooms")
        for ivls in room_opt_ivls.values():
            if len(ivls) > 1:
                self.model.AddNoOverlap(ivls)

        # ── C3: Division no-overlap ───────────────────────────────────────
        n3 = sum(1 for v in division_ivls.values() if len(v) > 1)
        print(f"  C3 Division no-overlap: {n3} divisions")
        for ivls in division_ivls.values():
            if len(ivls) > 1:
                self.model.AddNoOverlap(ivls)

        # ── C4: Batch no-overlap ──────────────────────────────────────────
        n4 = sum(1 for v in batch_ivls.values() if len(v) > 1)
        print(f"  C4 Batch no-overlap: {n4} batches")
        for ivls in batch_ivls.values():
            if len(ivls) > 1:
                self.model.AddNoOverlap(ivls)

        # ── C5/C12: Div↔Batch no-overlap ─────────────────────────────────
        n5 = sum(1 for v in div_batch_ivls.values() if len(v) > 1)
        print(f"  C5/C12 Div↔Batch no-overlap: {n5} pairs")
        for ivls in div_batch_ivls.values():
            if len(ivls) > 1:
                self.model.AddNoOverlap(ivls)

        # ── Decision strategy: SELECT_MIN_VALUE (placement-first) ────────────
        #
        # Branch on earliest slot first. Priority: Labs (most constrained, 2-slot)
        # then Tutorials, then Theory (most flexible).
        if lab_start_vars:
            self.model.AddDecisionStrategy(
                lab_start_vars,
                cp_model.CHOOSE_MIN_DOMAIN_SIZE,
                cp_model.SELECT_MIN_VALUE,
            )
        if tutorial_start_vars:
            self.model.AddDecisionStrategy(
                tutorial_start_vars,
                cp_model.CHOOSE_MIN_DOMAIN_SIZE,
                cp_model.SELECT_MIN_VALUE,
            )
        if theory_start_vars:
            self.model.AddDecisionStrategy(
                theory_start_vars,
                cp_model.CHOOSE_MIN_DOMAIN_SIZE,
                cp_model.SELECT_MIN_VALUE,
            )

        # Room bool strategy: once time is fixed, assign rooms greedily
        all_room_bools: list[cp_model.BoolVar] = []
        for sid in sorted(self.session_room_bools.keys()):
            for rname, bv in self.session_room_bools[sid].items():
                all_room_bools.append(bv)
        if all_room_bools:
            self.model.AddDecisionStrategy(
                all_room_bools,
                cp_model.CHOOSE_FIRST,
                cp_model.SELECT_MAX_VALUE,
            )

        print(
            f"  ✓ Decision strategy: Labs({len(lab_start_vars)}) → "
            f"Tutorials({len(tutorial_start_vars)}) → Theory({len(theory_start_vars)})"
            f"  [SELECT_MIN_VALUE — placement-first]"
        )

        # ══════════════════════════════════════════════════════════════
        # Day-load balancing with multi-level objective
        # ══════════════════════════════════════════════════════════════
        #
        # Objective priority hierarchy:
        #   P1: BIG_M × weighted_placed         ← maximise sessions (dominant)
        #   P2: BALANCE_WEIGHT × imbalance      ← minimise max−min day spread
        #   P3: DEV_WEIGHT × Σdev[d]            ← minimise mean-abs deviation
        #   P4: SAT_PENALTY × saturday_load     ← discourage Saturday overflow
        #
        # BIG_M = len(sessions) + 1 guarantees placing one more session always
        # outweighs any reduction in secondary/tertiary/quaternary penalties.

        n_days = len(self.days)
        BIG_M = len(self.sessions) + 1

        # Per-day slot sets: global slot indices belonging to each day
        day_slot_sets: list[list[int]] = []
        for d in range(n_days):
            day_slot_sets.append(
                sorted(
                    g for g, (gday, _) in self.global_to_day_slot.items() if gday == d
                )
            )

        # day_load[d] counts sessions placed on day d.
        # on_day[sid][d] = 1 iff placed AND start ∈ day_d_slots.
        all_start_values = sorted(
            set(self.allowed_theory_starts) | set(self.allowed_lab_starts)
        )
        all_starts_dom = cp_model.Domain.FromValues(all_start_values)

        day_load: list[cp_model.IntVar] = []
        for d in range(n_days):
            dload = self.model.NewIntVar(0, len(self.sessions), f"day_load_{d}")
            day_load.append(dload)

        # Per-lecture Saturday penalty terms (ported from final.py)
        saturday_idx = 5  # index in self.days ("Saturday") — hoisted here
        sat_lecture_penalty_terms: list = []

        for d in range(n_days):
            if not day_slot_sets[d]:
                self.model.Add(day_load[d] == 0)
                continue

            day_dom = cp_model.Domain.FromValues(day_slot_sets[d])
            not_day_dom = all_starts_dom.intersection_with(day_dom.complement())

            on_day_terms = []
            for sess in self.sessions:
                sid = sess["id"]
                placed = sess["placed_var"]
                start = self.session_starts[sid]

                on_day_bool = self.model.NewBoolVar(f"on_day_{sid}_{d}")

                # on_day → placed
                self.model.AddImplication(on_day_bool, placed)

                # on_day → start ∈ day d
                self.model.AddLinearExpressionInDomain(start, day_dom).OnlyEnforceIf(
                    on_day_bool
                )

                # placed ∧ start ∉ day d → ¬on_day
                if not_day_dom.size() > 0:
                    self.model.AddLinearExpressionInDomain(
                        start, not_day_dom
                    ).OnlyEnforceIf([on_day_bool.Not(), placed])

                on_day_terms.append(on_day_bool)

                # Medium per-lecture penalty for any session on Saturday.
                # on_day_bool is already 1 iff placed AND starts on day d —
                # no new variable required.
                if d == saturday_idx:
                    sat_lecture_penalty_terms.append(SAT_LECTURE_PENALTY * on_day_bool)

            self.model.Add(day_load[d] == sum(on_day_terms))

        # max and min day load auxiliary variables
        max_day_load = self.model.NewIntVar(0, len(self.sessions), "max_day_load")
        min_day_load = self.model.NewIntVar(0, len(self.sessions), "min_day_load")
        self.model.AddMaxEquality(max_day_load, day_load)
        self.model.AddMinEquality(min_day_load, day_load)

        # imbalance = max_day_load − min_day_load
        imbalance = self.model.NewIntVar(0, len(self.sessions), "imbalance")
        self.model.Add(imbalance == max_day_load - min_day_load)

        self._day_load_vars = day_load
        self._imbalance_var = imbalance

        # saturday_load penalised to discourage overflow onto Saturday
        # (saturday_idx already defined above for sat_lecture_penalty_terms)
        saturday_load = day_load[saturday_idx] if saturday_idx < n_days else None

        # dev[d] = |day_load[d] − avg_load| (mean-absolute deviation)
        n_total = len(self.sessions)
        avg_load = n_total // n_days  # integer floor of ideal sessions/day

        dev_vars: list[cp_model.IntVar] = []
        for d in range(n_days):
            diff = self.model.NewIntVar(-n_total, n_total, f"diff_{d}")
            self.model.Add(diff == day_load[d] - avg_load)
            dev = self.model.NewIntVar(0, n_total, f"dev_{d}")
            self.model.AddAbsEquality(dev, diff)
            dev_vars.append(dev)

        self._dev_vars = dev_vars

        # ── Theory-only soft constraints (ported from final.py) ───────────
        theory_penalty_terms = self._add_theory_soft_constraints()

        # ── Combined multi-level objective (4-level + soft penalties) ────
        #
        # Maximize:
        #   BIG_M × weighted_placed            [P1: placement — dominant]
        #   − BALANCE_WEIGHT × imbalance       [P2: day-load max−min spread]
        #   − DEV_WEIGHT × Σdev[d]             [P3: mean-abs day deviation]
        #   − SAT_PENALTY × saturday_load      [P4: Saturday penalty]
        #   − Σ theory_penalty_terms           [P5: theory soft constraints]
        #   − Σ online_penalty_terms           [P6: discourage online]
        #   − Σ sat_lecture_penalty_terms      [P7: per-lecture Saturday penalty]

        weighted_placed = sum(objective_terms)

        obj = BIG_M * weighted_placed - BALANCE_WEIGHT * imbalance
        obj = obj - DEV_WEIGHT * sum(dev_vars)
        if saturday_load is not None:
            obj = obj - SAT_PENALTY * saturday_load
        if theory_penalty_terms:
            obj = obj - sum(theory_penalty_terms)
        if online_penalty_terms:
            obj = obj - sum(online_penalty_terms)
        if sat_lecture_penalty_terms:
            obj = obj - sum(sat_lecture_penalty_terms)

        self.model.Maximize(obj)

        total_weight = sum(SESSION_WEIGHTS.get(s["type"], 1) for s in self.sessions)
        sat_desc = (
            f" − {SAT_PENALTY}×saturday_load" if saturday_load is not None else ""
        )
        theory_desc = (
            " − Σ(theory soft-constraint penalties)" if theory_penalty_terms else ""
        )
        online_desc = (
            f" − Σ({ONLINE_PENALTY}×online_lecture)" if online_penalty_terms else ""
        )
        sat_lecture_desc = (
            f" − Σ({SAT_LECTURE_PENALTY}×sat_lecture)"
            if sat_lecture_penalty_terms
            else ""
        )
        print(
            f"  OK Objective (v16, 4-level + theory soft constraints "
            f"+ online/Saturday penalties):\n"
            f"      Maximize  {BIG_M}xweighted_placed\n"
            f"              - {BALANCE_WEIGHT}ximbalance\n"
            f"              - {DEV_WEIGHT}xSum|day_load[d]-{avg_load}|"
            f"{sat_desc}"
            f"{theory_desc}"
            f"{online_desc}"
            f"{sat_lecture_desc}\n"
            f"    (CT days fixed by CT_MATRIX — no CT balance term)\n"
            f"    (max_weight={total_weight * BIG_M}, "
            f"BIG_M={BIG_M}, BALANCE_WEIGHT={BALANCE_WEIGHT})"
        )
        print(f"  ✓ Model built in {time.time()-t0:.2f}s")
        return True

    # ──────────────────────────────────────────────────────────────
    # STEP 4b — Greedy warm-start hints
    # ──────────────────────────────────────────────────────────────
    def _add_solution_hints(self):
        """Greedy room/time assignment used as CP-SAT warm-start hints.

        Slots are tried in sorted (earliest-first) order, consistent with the
        SELECT_MIN_VALUE decision strategy. This maximises density of the initial
        incumbent so LNS has the best possible starting point.
        """
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

    # ──────────────────────────────────────────────────────────────
    # STEP 5 — Solve
    # ──────────────────────────────────────────────────────────────
    def solve(self, time_limit: int = 600, use_hints: bool = True) -> bool:
        print(f"\n[5/6] Solving (limit: {time_limit}s) …")

        if use_hints:
            print("  Building solution hints …")
            self._add_solution_hints()

        self.solver.parameters.max_time_in_seconds = time_limit
        self.solver.parameters.log_search_progress = True
        self.solver.parameters.random_seed = 42
        self.solver.parameters.cp_model_presolve = True
        self.solver.parameters.num_search_workers = 2
        self.solver.parameters.linearization_level = 1
        self.solver.parameters.cp_model_probing_level = 0
        self.solver.parameters.interleave_search = True
        self.solver.parameters.share_binary_clauses = True
        self.solver.parameters.diversify_lns_params = True
        self.solver.parameters.use_lns_only = False
        self.solver.parameters.shared_tree_num_workers = 2

        t0 = time.time()
        status = self.solver.Solve(self.model)
        elapsed = time.time() - t0

        print(f"\n  Solved in {elapsed:.1f}s  |  {self.solver.StatusName(status)}")
        print("\n===== Solver Statistics =====")
        print(f"Branches : {self.solver.NumBranches()}")
        print(f"Conflicts: {self.solver.NumConflicts()}")
        print(f"Wall time: {self.solver.WallTime():.2f}s")
        print("=" * 29)

        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            self._print_diagnostic_report()
            return True

        if status == cp_model.INFEASIBLE:
            print("  ✗ INFEASIBLE — even the relaxed (optional-session) model")
            print("    has no solution. This should not happen; check room/time data.")
        else:
            print("  ✗ UNKNOWN — no solution within time limit.")
            print(f"    → Try: --time-limit {time_limit * 2}")
            print("    → Or:  reduce --workers to match your CPU core count")
        return False
