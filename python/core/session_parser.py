"""STEP 2 — Parse sessions.

Turns each Faculty-sheet row into the flat list of `sessions` (one dict
per Theory/Lab/Tutorial occurrence) that build_model() turns into CP-SAT
variables. Theory-session construction lives here; Lab/Tutorial-session
construction (which also handles CT dedicated rooms) lives in
lab_session_parser.py — parse_sessions() calls both per row, in the same
order the original single function did.
"""

import pandas as pd

from ..utils import parse_cell, safe_int


class SessionParserMixin:
    """Session-parsing instance methods, mixed into TimetableScheduler."""

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
                theory_sessions, sid = self._build_theory_sessions_for_row(
                    cur_name, course, th, divs, sid
                )
                self.sessions.extend(theory_sessions)
                th_cnt += len(theory_sessions)

            if prtu > 0:
                lt_sessions, sid, lab_added, tut_added = (
                    self._build_lab_tutorial_sessions_for_row(
                        cur_name, course, prtu, bats, warned, sid
                    )
                )
                self.sessions.extend(lt_sessions)
                lab_cnt += lab_added
                tut_cnt += tut_added

        print(
            f"  ✓ Sessions: {len(self.sessions)}  "
            f"(Theory={th_cnt}, Lab={lab_cnt}, Tutorial={tut_cnt})"
        )
        return bool(self.sessions)

    def _build_theory_sessions_for_row(
        self, cur_name: str, course: str, th: int, divs: list, sid: int
    ) -> tuple[list[dict], int]:
        """Build the Theory session dicts for one Faculty-sheet row.

        Returns (sessions, next_sid). CT rows are skipped entirely — CT-A:
        CT is a reserved blocking slot, never scheduled as its own session.
        """
        sessions: list[dict] = []
        if course.strip().upper() == "CT":
            return sessions, sid  # CT-A: not scheduled; handled as a blocked slot

        entities = divs if divs else [None]
        per = th // len(entities)
        rem = th % len(entities)
        for i, ent in enumerate(entities):
            n = per + (1 if i < rem else 0)
            label = ent if ent else "—"
            entity = ent if ent else f"_fth{sid}"
            sess_rooms = list(self.theory_rooms)
            sess_can_online = True
            for _ in range(n):
                sessions.append(
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
        return sessions, sid
