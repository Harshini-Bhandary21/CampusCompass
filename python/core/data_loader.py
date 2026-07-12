"""Excel ingestion — turns the input workbook (Faculty / Rooms / Time /
CT_Rooms sheets) into the scheduler's working state: room pools and
time-slot maps. Session construction itself lives in session_parser.py /
lab_session_parser.py.
"""

import pandas as pd

from ..schedulers.ct import _load_ct_batches_from_faculty


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

        # CT room registration/isolation + CT slot index discovery.
        self._setup_ct_rooms_and_slots()

        print(f"  ✓ Slots: {self.time_slots_per_day}, lunch@{self.lunch_slot}")
        print(
            f"  ✓ Theory rooms: {len(self.theory_rooms)}, "
            f"Lab rooms: {len(self.all_lab_rooms)}"
        )
        print(f"  ✓ Lab subjects in Rooms sheet: {list(self.subject_lab_rooms.keys())}")
        print(f"  ✓ Faculty rows: {len(self.faculty_df)}")
        return True
