"""Symmetry breaking, NoOverlap constraints (C1-C5/C12), and CP-SAT decision
strategies — built from the collections session_variables.py assembles."""

from ortools.sat.python import cp_model


class ConstraintsMixin:
    def _add_symmetry_breaking(self, clone_groups):
        sym_count = 0
        for key, svars in clone_groups.items():
            if len(svars) > 1:
                for i in range(len(svars) - 1):
                    self.model.Add(svars[i] <= svars[i + 1])
                    sym_count += 1
        print(f"  ✓ Symmetry breaking: {sym_count} ordering constraints added")

    def _add_no_overlap_constraints(self, state):
        faculty_ivls = state["faculty_ivls"]
        room_opt_ivls = state["room_opt_ivls"]
        division_ivls = state["division_ivls"]
        batch_ivls = state["batch_ivls"]
        div_batch_ivls = state["div_batch_ivls"]

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

    def _add_decision_strategies(self, state):
        lab_start_vars = state["lab_start_vars"]
        tutorial_start_vars = state["tutorial_start_vars"]
        theory_start_vars = state["theory_start_vars"]

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
