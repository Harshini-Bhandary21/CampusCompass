"""Lab/Tutorial session construction — the PR/TU half of parse_sessions().

Handles the CT dedicated-room hard constraint (a CT batch with a mapped
room in CT_Rooms must use ONLY that room) and splits each batch's PR/TU
hours into 2-slot Lab sessions plus a trailing 1-slot Tutorial if the
remainder is odd.
"""

from ..config import BATCH_TO_DIVISION


class LabSessionParserMixin:
    """Lab/Tutorial-parsing instance methods, mixed into TimetableScheduler."""

    def _build_lab_tutorial_sessions_for_row(
        self,
        cur_name: str,
        course: str,
        prtu: int,
        bats: list,
        warned: set,
        sid: int,
    ) -> tuple[list[dict], int, int, int]:
        """Build the Lab/Tutorial session dicts for one Faculty-sheet row.

        Returns (sessions, next_sid, lab_count_added, tutorial_count_added).
        """
        sessions: list[dict] = []
        lab_added = tut_added = 0

        # _lab_rooms_for() is called unconditionally (even when bats is
        # empty and its result unused) to preserve the original one-warning-
        # per-course behaviour recorded in `warned`.
        lab_rooms = self._lab_rooms_for(course, warned)

        if bats:
            hrs = max(1, round(prtu / len(bats)))
            for batch in bats:
                h = hrs

                # ── CT hard room constraint ───────────────────────────
                # If this batch has a dedicated room in CT_Rooms, use
                # ONLY that room.  This is a hard constraint: the solver
                # must never consider any other room for this batch.
                #
                # NOTE: CT dedicated rooms are no longer in self.all_lab_rooms
                # (they were removed from the generic pool in load_data to
                # prevent non-CT sessions from competing for them).
                # We check self.ct_dedicated_rooms instead.
                batch_upper = batch.strip().upper()
                if hasattr(self, "ct_room_map") and batch_upper in self.ct_room_map:
                    ct_room = self.ct_room_map[batch_upper]
                    if ct_room in self.ct_dedicated_rooms:
                        batch_rooms = [ct_room]
                    else:
                        print(
                            f"  ⚠ CT-Rooms WARNING: room '{ct_room}' for batch "
                            f"'{batch}' was not registered — falling back to "
                            f"generic lab rooms.  Check CT_Rooms sheet."
                        )
                        batch_rooms = lab_rooms
                else:
                    batch_rooms = lab_rooms
                # ─────────────────────────────────────────────────────

                # ── CT-P: Determine if this is a CT batch session ───
                # CT batch sessions must be pinned to exactly the
                # 15:10 slot on the FY division's CT day (set in
                # build_model via ct_global_per_day).  We tag them
                # here so build_model can identify and pin them.
                is_ct_batch_sess = course.strip().upper() == "CT"

                while h >= 2:
                    sessions.append(
                        {
                            "id": sid,
                            "faculty": cur_name,
                            "course": course,
                            "label": batch,
                            "entity": batch,
                            "etype": "batch",
                            "div_family": BATCH_TO_DIVISION.get(batch),
                            "type": "Lab",
                            "duration": 2,
                            "rooms": batch_rooms,
                            "can_online": False,
                            "ct_batch": is_ct_batch_sess,  # CT-P pin flag
                        }
                    )
                    sid += 1
                    lab_added += 1
                    h -= 2
                if h == 1:
                    sessions.append(
                        {
                            "id": sid,
                            "faculty": cur_name,
                            "course": course + " (Tutorial)",
                            "label": batch,
                            "entity": batch,
                            "etype": "batch",
                            "div_family": BATCH_TO_DIVISION.get(batch),
                            "type": "Tutorial",
                            "duration": 1,
                            "rooms": list(self.theory_rooms),
                            "can_online": True,
                        }
                    )
                    sid += 1
                    tut_added += 1
        else:
            for _ in range(prtu):
                sessions.append(
                    {
                        "id": sid,
                        "faculty": cur_name,
                        "course": course + " (Tutorial)",
                        "label": "—",
                        "entity": f"_ftu{sid}",
                        "etype": "batch",
                        "div_family": None,
                        "type": "Tutorial",
                        "duration": 1,
                        "rooms": list(self.theory_rooms),
                        "can_online": True,
                    }
                )
                sid += 1
                tut_added += 1

        return sessions, sid, lab_added, tut_added
