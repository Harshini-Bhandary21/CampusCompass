"""
Excel ingestion and session construction.

DataLoaderMixin turns the input workbook (Faculty / Rooms / Time / CT_Rooms
sheets) into the scheduler's working state: room pools, time-slot maps, and
the flat list of `sessions` (one dict per Theory/Lab/Tutorial occurrence)
that build_model() turns into CP-SAT variables.
"""

import pandas as pd

from .ct import _load_ct_batches_from_faculty
from .config import BATCH_TO_DIVISION
from .utils import parse_cell, safe_int


class DataLoaderMixin:
    """Data-loading instance methods, mixed into TimetableScheduler."""

    # ──────────────────────────────────────────────────────────────
    # STEP 1 — Load
    # ──────────────────────────────────────────────────────────────
    def load_data(self, excel_file: str) -> bool:
        print("=" * 70)
        print("  TIMETABLE SCHEDULER  v16  --  CT data-driven static matrix")
        print("=" * 70)
        print("\n[1/6] Loading data …")
        try:
            self.faculty_df = pd.read_excel(excel_file, sheet_name="Faculty")
            self.room_df = pd.read_excel(excel_file, sheet_name="Rooms")

            # ---------------------------------------------------
            # CT Room Mapping
            # ---------------------------------------------------
            try:
                ct_df = pd.read_excel(excel_file, sheet_name="CT_Rooms")

                self.ct_room_map = {}

                for _, row in ct_df.iterrows():
                    batch = str(row["Batch"]).strip().upper()
                    room = str(row["Room"]).strip()  # preserve original casing
                    self.ct_room_map[batch] = room

                print(f"  ✓ CT room mappings loaded: " f"{len(self.ct_room_map)}")

            except Exception:
                self.ct_room_map = {}
                print("  ℹ No CT_Rooms sheet found")

            self.time_df = pd.read_excel(excel_file, sheet_name="Time")
        except Exception as e:
            print(f"  ✗ {e}")
            return False

        # ── CT-DYN: populate CT_* batch groups from Faculty sheet ──────────
        # Must be called after self.faculty_df is loaded and before
        # parse_sessions() so that DIVISION_TO_BATCHES and BATCH_TO_DIVISION
        # reflect the real CT batches in this workbook.
        _load_ct_batches_from_faculty(self.faculty_df)

        for _, r in self.time_df.iterrows():
            self.time_slots[int(r["Index"])] = str(r["Slot"]).strip()
        self.time_slots_per_day = len(self.time_slots)
        s = sorted(self.time_slots)
        self.lunch_slot = 5 if 5 in self.time_slots else s[len(s) // 2]

        self.subject_lab_rooms = {}
        for _, r in self.room_df.iterrows():
            name = str(r["Rooms"]).strip()
            rtype = str(r.get("Type", "Theory")).strip().lower()
            subj = (
                str(r.get("Subject", "")).strip()
                if pd.notna(r.get("Subject", ""))
                else ""
            )
            if rtype == "theory":
                self.theory_rooms.append(name)
            else:
                self.all_lab_rooms.append(name)
                if subj:
                    self.subject_lab_rooms.setdefault(subj, []).append(name)

        # CT room registration/isolation + CT slot index discovery — see ct.py.
        self._setup_ct_rooms_and_slots()

        print(f"  ✓ Slots: {self.time_slots_per_day}, lunch@{self.lunch_slot}")
        print(
            f"  ✓ Theory rooms: {len(self.theory_rooms)}, "
            f"Lab rooms: {len(self.all_lab_rooms)}"
        )
        print(f"  ✓ Lab subjects in Rooms sheet: {list(self.subject_lab_rooms.keys())}")
        print(f"  ✓ Faculty rows: {len(self.faculty_df)}")
        return True

    # ──────────────────────────────────────────────────────────────
    # STEP 2 — Parse sessions
    # ──────────────────────────────────────────────────────────────
    def parse_sessions(self) -> bool:
        print("\n[2/6] Parsing sessions …")
        cols = {c.strip(): c for c in self.faculty_df.columns}

        def col(n):
            return cols.get(n)

        sid = 0
        cur_name = None
        th_cnt = lab_cnt = tut_cnt = 0
        warned: set[str] = set()

        for _, row in self.faculty_df.iterrows():
            nc = col("Name of Faculty")
            if nc and pd.notna(row.get(nc)):
                v = str(row[nc]).strip()
                if v and not v.upper().startswith("TOTAL"):
                    cur_name = v
            if not cur_name:
                continue

            cc = col("Course Name")
            if not cc or pd.isna(row.get(cc)):
                continue
            course = str(row[cc]).strip()
            if not course or course.upper().startswith("TOTAL"):
                continue

            th = safe_int(row.get(col("TH")))
            prtu = safe_int(row.get(col("PR/TU")))
            divs = parse_cell(row.get(col("Division")))
            bats = parse_cell(row.get(col("Batch")))

            if th > 0:
                entities = divs if divs else [None]
                per = th // len(entities)
                rem = th % len(entities)
                for i, ent in enumerate(entities):
                    n = per + (1 if i < rem else 0)
                    label = ent if ent else "—"
                    entity = ent if ent else f"_fth{sid}"
                    # ── CT-A: Skip CT sessions — CT is a reserved blocking slot ─
                    if course.strip().upper() == "CT":
                        continue  # CT-A: not scheduled; handled as a blocked slot
                    sess_rooms = list(self.theory_rooms)
                    sess_can_online = True
                    for _ in range(n):
                        self.sessions.append(
                            {
                                "id": sid,
                                "faculty": cur_name,
                                "course": course,
                                "label": label,
                                "entity": entity,
                                "etype": "division",
                                "div_family": ent,
                                "type": "Theory",
                                "duration": 1,
                                "rooms": sess_rooms,
                                "can_online": sess_can_online,
                            }
                        )
                        sid += 1
                        th_cnt += 1

            if prtu > 0:
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
                        if (
                            hasattr(self, "ct_room_map")
                            and batch_upper in self.ct_room_map
                        ):
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
                            self.sessions.append(
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
                            lab_cnt += 1
                            h -= 2
                        if h == 1:
                            self.sessions.append(
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
                            tut_cnt += 1
                else:
                    for _ in range(prtu):
                        self.sessions.append(
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
                        tut_cnt += 1

        print(
            f"  ✓ Sessions: {len(self.sessions)}  "
            f"(Theory={th_cnt}, Lab={lab_cnt}, Tutorial={tut_cnt})"
        )
        return bool(self.sessions)
