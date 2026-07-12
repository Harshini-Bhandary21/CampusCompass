"""ITERATIVE REPAIR — the outer loop that runs solve() repeatedly, freezing
scheduled sessions between passes so only unscheduled sessions stay flexible.

Because frozen sessions are forced placed==1 with a fixed start/room, all
NoOverlap / CT_MATRIX / room / faculty / division / batch constraints
automatically treat that slot as permanently occupied — so newly-flexible
(previously unscheduled) sessions can never be scheduled into a frozen
session's slot. This IS the freezing mechanism; no separate "blocked
slots" list is needed.
"""


class RepairLoopMixin:
    """Iterative-repair loop instance methods, mixed into RepairMixin."""

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

    def _print_repair_summary(self, initial_scheduled, final_scheduled) -> None:
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

        self._print_repair_summary(initial_scheduled, prev_scheduled)
        return success_any
