"""
ITERATIVE REPAIR — capture / freeze / loop.

Design summary
--------------
Each repair pass builds a brand-new CpModel + CpSolver (CP-SAT models are
write-only; vars/constraints can't be removed). Sessions that were
successfully placed in a previous pass are marked with sess["_frozen"] =
{"start": g, "room": room_name}. build_model() reads this marker and adds
plain `Add(placed==1)`, `Add(start==g)`, and per-room `Add(bv==.../0)`
constraints — i.e. it pins the SAME variables that every existing
constraint (NoOverlap, CT-R, C11, objective, decision strategy) already
references. No constraint, objective term, or strategy is rewritten;
frozen sessions simply have a single-valued domain instead of a range.

Because frozen sessions are forced placed==1 with a fixed start/room, all
NoOverlap / CT_MATRIX / room / faculty / division / batch constraints
automatically treat that slot as permanently occupied — so newly-flexible
(previously unscheduled) sessions can never be scheduled into a frozen
session's slot. This IS the freezing mechanism; no separate "blocked
slots" list is needed.
"""

from collections import Counter, defaultdict

from ortools.sat.python import cp_model


class RepairMixin:
    """Iterative-repair / LNS instance methods, mixed into TimetableScheduler."""

    def capture_solution(self) -> int:
        """Read the current solver solution and mark scheduled sessions.

        For every session with placed_var == 1, store:
            sess["_frozen"] = {"start": <int>, "room": <room name or 'ONLINE'>}

        Sessions already frozen from a prior pass keep their existing
        "_frozen" entry untouched (they are still placed==1 by construction).
        Returns the number of newly-frozen sessions in this call.
        """
        newly_frozen = 0
        for sess in self.sessions:
            if sess.get("_frozen") is not None:
                continue  # already frozen from an earlier pass
            if self.solver.Value(sess["placed_var"]) != 1:
                continue

            sid = sess["id"]
            g = self.solver.Value(self.session_starts[sid])

            room_name = next(
                (
                    rn
                    for rn, bv in self.session_room_bools[sid].items()
                    if self.solver.Value(bv)
                ),
                "ONLINE",
            )

            sess["_frozen"] = {"start": g, "room": room_name}
            newly_frozen += 1

        return newly_frozen

    def freeze_solution(self) -> None:
        """Alias / explicit entry point: capture + freeze all currently
        scheduled sessions so the next build_model() pins them.

        Kept as a separate method (per the requested clean design) even
        though capture_solution() already performs the freezing — this
        makes the iterative_repair() loop read clearly as
        'capture, then freeze, then rebuild'.
        """
        self.capture_solution()

    def _reset_solver_state(self) -> None:
        """Discard the current CpModel/CpSolver and per-session solver
        artifacts so build_model() can run again from a clean slate.

        sess["_frozen"] markers are NOT touched — they are the only state
        that carries across passes.
        """
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()

        self.session_starts = {}
        self.session_ends = {}
        self.session_intervals = {}
        self.session_room_bools = defaultdict(dict)

        self._day_load_vars = []
        self._imbalance_var = None
        self._dev_vars = []

        for sess in self.sessions:
            sess.pop("placed_var", None)

    def _scheduled_unscheduled_counts(self) -> tuple[int, int, Counter]:
        """Return (n_scheduled, n_unscheduled, type_counter_for_scheduled)."""
        scheduled = [s for s in self.sessions if s.get("_frozen") is not None]
        n_sch = len(scheduled)
        n_uns = len(self.sessions) - n_sch
        type_counts = Counter(s["type"] for s in scheduled)
        return n_sch, n_uns, type_counts

    # ──────────────────────────────────────────────────────────────
    # LNS REPAIR — select movable sessions for neighbourhood relaxation
    # ──────────────────────────────────────────────────────────────

    def _select_lns_neighbourhood(
        self,
        unscheduled_sessions: list[dict],
        freeze_ratio: float = 0.95,
    ) -> set[int]:
        """Identify a small set of SCHEDULED session IDs to unfreeze (make
        movable) for the LNS repair pass.

        Strategy (in priority order):
          1. Prefer sessions that share the same FACULTY as an unscheduled
             session — releasing them may free a time slot the solver needs.
          2. Then prefer sessions that share the same DIVISION/ENTITY.
          3. Then prefer sessions that share the same ROOM POOL
             (overlapping rooms list).
          4. Then prefer sessions on the same DAY as an unscheduled session
             (if its frozen["start"] maps to a day on which unscheduled
             sessions are most concentrated).

        The number of sessions to unfreeze is:
            n_movable = max(1, round((1 - freeze_ratio) * n_frozen))
        so with freeze_ratio=0.95 and 848 frozen sessions ≈ 42 become movable.

        Returns a set of session IDs that should have their "_frozen" marker
        temporarily removed before build_model() is called.
        """
        import random

        # All currently frozen sessions
        frozen_sessions = [s for s in self.sessions if s.get("_frozen") is not None]
        n_frozen = len(frozen_sessions)
        if n_frozen == 0 or not unscheduled_sessions:
            return set()

        n_movable = max(1, round((1.0 - freeze_ratio) * n_frozen))

        # ── Build lookup sets from unscheduled sessions ───────────────────
        uns_faculties: set[str] = {s["faculty"] for s in unscheduled_sessions}
        uns_entities: set[str] = {s["entity"] for s in unscheduled_sessions}
        uns_div_families: set[str] = {
            s["div_family"] for s in unscheduled_sessions if s.get("div_family")
        }
        uns_room_sets: list[set[str]] = [set(s["rooms"]) for s in unscheduled_sessions]

        # Days on which unscheduled sessions would most benefit from relief:
        # count how many frozen sessions sit on each day and compare with
        # which days carry unscheduled sessions' closest relatives.
        uns_days: set[int] = set()
        for s in unscheduled_sessions:
            # Use the entity's frozen siblings' days as a proxy
            for fs in frozen_sessions:
                if fs["faculty"] == s["faculty"] or fs["entity"] == s["entity"]:
                    fz = fs.get("_frozen", {})
                    g = fz.get("start")
                    if g is not None and g in self.global_to_day_slot:
                        d, _ = self.global_to_day_slot[g]
                        uns_days.add(d)

        # ── Score each frozen session ─────────────────────────────────────
        # Higher score → more beneficial to unfreeze for this neighbourhood.
        scored: list[tuple[float, int, dict]] = []

        for fs in frozen_sessions:
            score = 0.0
            fz = fs.get("_frozen", {})
            g = fz.get("start")
            fs_day = (
                self.global_to_day_slot[g][0]
                if (g is not None and g in self.global_to_day_slot)
                else -1
            )

            # Priority 1: same faculty as an unscheduled session (+4 pts)
            if fs["faculty"] in uns_faculties:
                score += 4.0

            # Priority 2: same entity/division family (+3 pts)
            if fs["entity"] in uns_entities:
                score += 3.0
            if fs.get("div_family") in uns_div_families:
                score += 2.0

            # Priority 3: overlapping room pool (+2 pts, scaled by overlap)
            fs_rooms = set(fs["rooms"])
            for ur in uns_room_sets:
                overlap = len(fs_rooms & ur)
                if overlap > 0:
                    score += 2.0 * (overlap / max(len(fs_rooms), len(ur)))
                    break  # count once per frozen session

            # Priority 4: on a day relevant to unscheduled sessions (+1 pt)
            if fs_day in uns_days:
                score += 1.0

            # Tiny random tiebreak so repeated calls explore different neighbours
            score += random.uniform(0.0, 0.1)

            scored.append((score, fs["id"], fs))

        # Sort descending by score; take the top n_movable
        scored.sort(key=lambda x: -x[0])
        movable_ids = {sid for _, sid, _ in scored[:n_movable]}

        # ── Diagnostics ───────────────────────────────────────────────────
        top_reasons: list[str] = []
        for _, sid, fs in scored[: min(5, n_movable)]:
            reasons = []
            if fs["faculty"] in uns_faculties:
                reasons.append("faculty-match")
            if fs["entity"] in uns_entities:
                reasons.append("entity-match")
            if fs.get("div_family") in uns_div_families:
                reasons.append("div-family-match")
            fs_rooms = set(fs["rooms"])
            if any(fs_rooms & ur for ur in uns_room_sets):
                reasons.append("room-pool-overlap")
            fz = fs.get("_frozen", {})
            g = fz.get("start")
            fs_day = (
                self.global_to_day_slot[g][0]
                if (g is not None and g in self.global_to_day_slot)
                else -1
            )
            if fs_day in uns_days:
                reasons.append("same-day")
            top_reasons.append(
                f"    sid={sid:4d}  {fs['type']:<9}  {fs['faculty']:<28} "
                f"{fs['course'][:30]:<30}  [{', '.join(reasons) or 'tiebreak'}]"
            )

        print(
            f"\n  LNS neighbourhood: {n_movable} of {n_frozen} frozen sessions "
            f"unfrozen  (freeze_ratio={freeze_ratio:.0%})"
        )
        print(f"  Criteria: faculty-match, entity-match, room-pool-overlap, same-day")
        if top_reasons:
            print(f"  Top movable sessions (showing up to 5):")
            for r in top_reasons:
                print(r)

        return movable_ids

    def _apply_lns_unfreeze(self, movable_ids: set[int]) -> list[dict]:
        """Temporarily remove the '_frozen' marker from sessions in
        *movable_ids*.  Returns the list of (session, saved_frozen_value)
        tuples so the caller can restore them if needed.

        After calling this, build_model() will treat those sessions as
        unscheduled (flexible), allowing the solver to reshuffle them.
        """
        saved: list[tuple[dict, dict]] = []
        for sess in self.sessions:
            if sess["id"] in movable_ids and sess.get("_frozen") is not None:
                saved.append((sess, sess["_frozen"]))
                del sess["_frozen"]
        return saved  # type: ignore[return-value]

    def _restore_lns_freeze(self, saved: list) -> None:
        """Restore '_frozen' markers that were temporarily removed by
        _apply_lns_unfreeze().  Called if the LNS pass fails to improve.
        """
        for sess, frozen_val in saved:
            if sess.get("_frozen") is None:
                sess["_frozen"] = frozen_val

    # ──────────────────────────────────────────────────────────────
    # ITERATIVE REPAIR — print pass header table row
    # ──────────────────────────────────────────────────────────────

    @staticmethod
    def _print_repair_row(
        iteration: int,
        n_sch: int,
        n_uns: int,
        improvement: int | None,
        remaining_ids: list[int],
    ) -> None:
        """Print one diagnostic row for the iterative repair loop.

        Format:
          Iter  Scheduled  Unscheduled  Improvement  Remaining IDs
        """
        impr_str = f"+{improvement}" if improvement is not None else "—"
        ids_str = str(remaining_ids) if remaining_ids else "[]"
        print(
            f"\n  {'─'*85}"
            f"\n  Iter {iteration:>2}  |  Scheduled: {n_sch:>4}  |  "
            f"Unscheduled: {n_uns:>3}  |  "
            f"Improvement: {impr_str:>4}  |  "
            f"Remaining IDs: {ids_str}"
            f"\n  {'─'*85}"
        )

    def iterative_repair(
        self,
        max_iterations: int = 5,
        time_limit: int = 600,
        use_hints: bool = True,
        lns_freeze_ratio: float = 0.95,
        lns_start_pass: int = 3,
    ) -> bool:
        """Run the existing solve() repeatedly, freezing scheduled sessions
        between passes so only unscheduled sessions remain flexible.

        Pass 1  — normal, unmodified solve() over every session.
        Pass 2  — freeze all scheduled sessions; try to place the remaining.
        Pass 3+ — LNS repair: freeze 95% of scheduled sessions, unfreeze a
                  targeted 5% neighbourhood (same faculty / entity / room pool /
                  day as unscheduled sessions), rebuild and reoptimize.

        Stops when:
          • An iteration adds 0 newly-scheduled sessions, OR
          • All sessions are scheduled, OR
          • max_iterations is reached.

        Returns True if at least Pass 1 solved successfully.

        Parameters
        ----------
        lns_freeze_ratio : float
            Fraction of scheduled sessions to keep frozen during LNS passes
            (default 0.95 → release ≈5%).
        lns_start_pass : int
            Which iteration number to begin applying LNS neighbourhood
            relaxation (default 3; passes 1 and 2 use the original strategy).
        """
        initial_scheduled: int | None = None
        prev_scheduled = 0
        success_any = False

        # Print table header
        print("\n" + "=" * 85)
        print(
            f"  {'Iter':>4}  {'Scheduled':>10}  {'Unscheduled':>12}  "
            f"{'Improvement':>12}  Remaining Unscheduled IDs"
        )
        print("=" * 85)

        for iteration in range(1, max_iterations + 1):
            print("\n" + "#" * 70)
            print(f"  ITERATIVE REPAIR — Pass {iteration}/{max_iterations}")
            if iteration >= lns_start_pass:
                print(
                    f"  [LNS mode: freeze {lns_freeze_ratio:.0%} of scheduled, "
                    f"relax ≈{(1-lns_freeze_ratio):.0%} neighbourhood]"
                )
            print("#" * 70)

            lns_saved: list = []  # holds (sess, frozen_val) pairs for rollback

            if iteration > 1:
                # Always capture the latest solution first
                self.capture_solution()

                # ── LNS neighbourhood relaxation (Pass 3+) ────────────────
                if iteration >= lns_start_pass:
                    unscheduled_now = [
                        s for s in self.sessions if s.get("_frozen") is None
                    ]
                    if unscheduled_now:
                        movable_ids = self._select_lns_neighbourhood(
                            unscheduled_sessions=unscheduled_now,
                            freeze_ratio=lns_freeze_ratio,
                        )
                        lns_saved = self._apply_lns_unfreeze(movable_ids)
                        print(f"  → {len(lns_saved)} sessions unfrozen for LNS pass.")
                    else:
                        print("  → All sessions already scheduled; nothing to repair.")

                self._reset_solver_state()
                if not self.build_model():
                    print("  ✗ build_model() failed during repair — stopping.")
                    # Restore any LNS unfreezes before exiting
                    self._restore_lns_freeze(lns_saved)
                    break

            ok = self.solve(time_limit=time_limit, use_hints=use_hints)

            if not ok:
                # LNS pass failed: restore unfrozen sessions so we don't lose
                # previously scheduled work.
                if lns_saved:
                    print(
                        "  ⚠ LNS pass did not produce a solution — "
                        "restoring unfrozen sessions."
                    )
                    self._restore_lns_freeze(lns_saved)
                if iteration == 1:
                    return False
                print(f"  ✗ Pass {iteration} did not solve — stopping repair.")
                break

            success_any = True

            # capture_solution() is called here so the final pass is also
            # reflected in counts even if max_iterations is reached.
            self.capture_solution()
            n_sch, n_uns, type_counts = self._scheduled_unscheduled_counts()

            # IDs of sessions that are still unscheduled after this pass
            remaining_ids = [s["id"] for s in self.sessions if s.get("_frozen") is None]

            improvement: int | None = None
            if initial_scheduled is None:
                initial_scheduled = n_sch
            else:
                improvement = n_sch - prev_scheduled

            # ── Per-iteration diagnostic table row ────────────────────────
            self._print_repair_row(iteration, n_sch, n_uns, improvement, remaining_ids)

            print(f"\n  Scheduled Labs      = {type_counts.get('Lab', 0)}")
            print(f"  Scheduled Tutorials = {type_counts.get('Tutorial', 0)}")
            print(f"  Scheduled Theory    = {type_counts.get('Theory', 0)}")

            if n_uns == 0:
                print("\n  ✓ All sessions scheduled — stopping repair early.")
                prev_scheduled = n_sch
                break

            if improvement is not None and improvement <= 0:
                print(
                    f"\n  No improvement in Pass {iteration} "
                    f"({n_sch} == {prev_scheduled}) — stopping repair."
                )
                prev_scheduled = n_sch
                break

            prev_scheduled = n_sch

        final_scheduled = prev_scheduled
        print("\n" + "=" * 70)
        print("  ITERATIVE REPAIR — SUMMARY")
        print("=" * 70)
        print(f"  Initial scheduled count : {initial_scheduled}")
        print(f"  Final scheduled count   : {final_scheduled}")
        print(
            f"  Total improvement       : "
            f"+{final_scheduled - initial_scheduled if initial_scheduled is not None else 0}"
        )
        remaining_final = [s["id"] for s in self.sessions if s.get("_frozen") is None]
        if remaining_final:
            print(f"  Remaining unscheduled   : {len(remaining_final)} sessions")
            print(f"  Remaining IDs           : {remaining_final}")
            for s in self.sessions:
                if s.get("_frozen") is None:
                    print(
                        f"    sid={s['id']:4d}  {s['type']:<9}  "
                        f"{s['faculty']:<28}  {s['course']}"
                    )
        else:
            print("  ✓ All sessions scheduled!")
        print("=" * 70)

        return success_any
