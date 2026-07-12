"""STEP 5 — Solve."""

import time

from ortools.sat.python import cp_model


class SolveMixin:
    def solve(self, time_limit: int = 600, use_hints: bool = True) -> bool:
        print(f"\n[5/6] Solving (limit: {time_limit}s) …")

        if use_hints:
            print("  Building solution hints …")
            self._add_solution_hints()

        self.solver.parameters.max_time_in_seconds = time_limit
        self.solver.parameters.log_search_progress = False
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
