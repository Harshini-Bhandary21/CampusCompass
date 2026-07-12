"""LNS REPAIR — select movable sessions for neighbourhood relaxation."""

import random


class LNSMixin:
    """Large-Neighbourhood-Search instance methods, mixed into RepairMixin."""

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

        movable_ids, top_reasons = self._score_and_select_movable(
            frozen_sessions,
            n_movable,
            uns_faculties,
            uns_entities,
            uns_div_families,
            uns_room_sets,
            uns_days,
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

    def _score_and_select_movable(
        self,
        frozen_sessions,
        n_movable,
        uns_faculties,
        uns_entities,
        uns_div_families,
        uns_room_sets,
        uns_days,
    ):
        """Score each frozen session's benefit-to-unfreeze and pick the top
        n_movable. Higher score → more beneficial to unfreeze."""
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

        return movable_ids, top_reasons

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
        return saved

    def _restore_lns_freeze(self, saved: list) -> None:
        """Restore '_frozen' markers that were temporarily removed by
        _apply_lns_unfreeze().  Called if the LNS pass fails to improve.
        """
        for sess, frozen_val in saved:
            if sess.get("_frozen") is None:
                sess["_frozen"] = frozen_val
