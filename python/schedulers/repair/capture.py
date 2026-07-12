"""Capture/freeze the current solution, and reset solver state between
iterative-repair passes.

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
"""

from collections import Counter, defaultdict

from ortools.sat.python import cp_model


class RepairCaptureMixin:
    """Solution-capture / solver-reset instance methods, mixed into RepairMixin."""

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
