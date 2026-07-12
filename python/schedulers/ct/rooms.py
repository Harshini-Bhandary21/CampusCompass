"""CT room resolution/isolation + CT slot index discovery.

Called from load_data() once Rooms/Time sheets are parsed.
"""


class CTRoomsMixin:
    """CT room-related instance methods, mixed into CTMixin."""

    # ──────────────────────────────────────────────────────────────
    # CT room resolver
    # ──────────────────────────────────────────────────────────────
    def _ct_rooms_for(self, label: str) -> list[str]:
        """Return allowed rooms for a CT batch.

        Priority:
        1. Exact batch mapping from CT_Rooms sheet.
        2. All lab rooms fallback.
        """
        batch = label.strip().upper()

        if hasattr(self, "ct_room_map") and batch in self.ct_room_map:
            return [self.ct_room_map[batch]]

        return list(self.all_lab_rooms)

    # ──────────────────────────────────────────────────────────────
    # CT room registration/isolation + CT slot index discovery
    # (called from load_data() once Rooms/Time sheets are parsed)
    # ──────────────────────────────────────────────────────────────
    def _setup_ct_rooms_and_slots(self) -> None:
        # ── CT rooms: register dedicated CT rooms and isolate them ───────────
        #
        # Three things must happen:
        #
        # 1. REGISTER: Every room named in CT_Rooms must be in self.all_lab_rooms
        #    so that room no-overlap intervals (C2) are created for it.
        #    Some CT rooms appear in the Rooms sheet as "Theory" (e.g. D302 used
        #    by ROBO track) — those must be moved from self.theory_rooms to
        #    self.all_lab_rooms so they participate in the lab interval pool.
        #    Rooms not in the Rooms sheet at all are appended fresh.
        #
        # 2. ISOLATE: CT-dedicated rooms must NOT remain in the generic lab pool
        #    (self.all_lab_rooms entries that non-CT sessions receive via
        #    _lab_rooms_for()). If they stay in the pool, EDS/DV/FAB-LAB sessions
        #    compete for H204A and crowd out CT sessions at solve time.
        #    We maintain a separate set self.ct_dedicated_rooms and strip those
        #    rooms from self.all_lab_rooms after registration so that
        #    _lab_rooms_for() never returns them.
        #
        # 3. VALIDATE: After registration, verify every mapped CT room is now in
        #    self.all_lab_rooms so that the parse_sessions check works.
        #
        if hasattr(self, "ct_room_map"):
            # Collect the unique set of rooms referenced by CT_Rooms sheet
            ct_dedicated = sorted(set(self.ct_room_map.values()))

            # Build fast-lookup sets (upper-cased for case-insensitive compare)
            lab_upper = {r.upper(): r for r in self.all_lab_rooms}
            theory_upper = {r.upper(): r for r in self.theory_rooms}

            added_new, moved_from_theory = [], []

            for room in ct_dedicated:
                ru = room.upper()
                if ru in lab_upper:
                    # Already in all_lab_rooms — nothing to do for registration.
                    pass
                elif ru in theory_upper:
                    # Room is registered as Theory; move it to lab pool so that
                    # the interval builder creates a lab-type no-overlap for it.
                    self.theory_rooms.remove(theory_upper[ru])
                    self.all_lab_rooms.append(room)
                    lab_upper[ru] = room
                    moved_from_theory.append(room)
                else:
                    # Room is completely new (not in Rooms sheet at all).
                    self.all_lab_rooms.append(room)
                    lab_upper[ru] = room
                    added_new.append(room)

            # Now ISOLATE: remove every CT-dedicated room from self.all_lab_rooms
            # so _lab_rooms_for() never hands them to non-CT sessions.
            # We keep them in a separate registry so parse_sessions can check them.
            self.ct_dedicated_rooms: set[str] = set(ct_dedicated)
            ct_dedicated_upper = {r.upper() for r in ct_dedicated}
            self.all_lab_rooms = [
                r for r in self.all_lab_rooms if r.upper() not in ct_dedicated_upper
            ]

            if added_new or moved_from_theory:
                print(
                    f"  ✓ CT-Rooms: registered "
                    f"{len(added_new)} new + {len(moved_from_theory)} theory→lab rooms: "
                    f"{added_new + moved_from_theory}"
                )
            print(
                f"  ✓ CT-Rooms: {len(ct_dedicated)} rooms isolated from generic pool "
                f"(non-CT sessions cannot use them)."
            )
        else:
            self.ct_dedicated_rooms = set()
        # ─────────────────────────────────────────────────────────────────

        # ── CT-K: Compute CT local slot indices dynamically ───────────────
        #
        # CT runs Mon-Thu at 15:10–16:50 spanning TWO consecutive slots:
        #   Slot 1 (ct_fixed_slot):   15:10–16:00
        #   Slot 2 (ct_fixed_slot+1): 16:00–16:50
        #
        # We scan the Time sheet for the slot whose start time is "15:10"
        # and store its LOCAL index.  The second slot is always ct_fixed_slot+1.
        # Global positions per day are computed inside build_model().
        #
        # self.ct_fixed_slot  : 1-based local index for the 15:10 slot (-1 = not found)
        # self.ct_fixed_slot2 : 1-based local index for the 16:00 slot (-1 = not found)
        #
        ct_slot_local = -1
        ct_slot_local2 = -1
        sorted_slots = sorted(self.time_slots.items())  # [(idx, slot_str), ...]
        for i, (slot_idx, slot_str) in enumerate(sorted_slots):
            start_time = slot_str.split("-")[0].strip()
            if start_time.startswith("15:10"):
                ct_slot_local = slot_idx
                # The very next slot in the Time sheet is the 16:00–16:50 period
                if i + 1 < len(sorted_slots):
                    ct_slot_local2 = sorted_slots[i + 1][0]
                else:
                    ct_slot_local2 = slot_idx + 1  # best guess
                break
        if ct_slot_local == -1:
            # Fallback: last usable slot (not lunch)
            usable = [idx for idx in sorted(self.time_slots) if idx != self.lunch_slot]
            ct_slot_local = usable[-1] if usable else sorted(self.time_slots)[-1]
            ct_slot_local2 = ct_slot_local + 1
            print(
                f"  WARNING CT-K: No 15:10 slot found in Time sheet -- "
                f"falling back to local slot {ct_slot_local} "
                f"({self.time_slots.get(ct_slot_local, '?')})"
            )
        # Store both local slot indices; global positions computed in build_model()
        self.ct_fixed_slot = ct_slot_local  # 15:10–16:00 (1-based local index)
        self.ct_fixed_slot2 = ct_slot_local2  # 16:00–16:50 (1-based local index)
        print(
            f"  OK CT-K: CT slots = [{ct_slot_local}, {ct_slot_local2}] "
            f"({self.time_slots.get(ct_slot_local, '?')} / "
            f"{self.time_slots.get(ct_slot_local2, '?')})  "
            f"[blocks Mon-Thu 15:10-16:50 for CT divisions]"
        )
        # ─────────────────────────────────────────────────────────────────
