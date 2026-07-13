"""Tunable weights/penalties that shape the CP-SAT objective.

Hierarchy (descending priority):
  P1: BIG_M × weighted_placed              — never trade a session for balance
  P2: BALANCE_WEIGHT × imbalance           — penalise max−min day spread
  P3: DEV_WEIGHT × Σ|day_load[d]−avg|     — penalise mean-absolute deviation
  P4: SAT_PENALTY × saturday_load          — discourage Saturday overflow

Separation guarantee:
  BIG_M > BALANCE_WEIGHT × max_imbalance (≤ n_sessions)
  so placing one more session ALWAYS beats any reduction in imbalance.
(BIG_M itself is computed from len(sessions) at build time — see
core/objective.py — since it depends on the loaded session count.)
"""

# Weights for the objective — higher = solver tries harder to place these.
# Labs get 3× because a missed lab requires manual intervention (room booking,
# faculty coordination across 2 consecutive slots). Adjust as needed.
SESSION_WEIGHTS = {"Lab": 3, "Tutorial": 2, "Theory": 1}

BALANCE_WEIGHT = 5  # secondary objective coefficient
DEV_WEIGHT = 1  # tertiary deviation coefficient
SAT_PENALTY = 1  # Saturday penalty coefficient

# ── Theory-only soft-constraint penalty weights ──────────────────────────────
#
# These are ADDITIONAL penalty terms layered on top of the existing 4-level
# objective (P1 placement / P2 imbalance / P3 deviation / P4 Saturday).
# They are intentionally much smaller than BIG_M (≈ n_sessions) so that the
# solver NEVER drops a session just to satisfy one of these preferences —
# placement always wins. Internally they keep a strict hierarchy:
#     HIGH_THEORY_PENALTY >> MEDIUM_THEORY_PENALTY >> LOW_THEORY_PENALTY
#
HIGH_THEORY_PENALTY = 50  # (1) same-subject adjacency, (2) different-room pairing
MEDIUM_THEORY_PENALTY = 10  # (3) early-slot (1 or 2) theory placement
LOW_THEORY_PENALTY = 2  # (4) late-slot (10 or 11) theory placement
SAME_DAY_SAME_SUBJECT_PENALTY = 20  # (0) same entity+course twice on same day

# ── Additional per-session soft-constraint penalty weights ────────────────────
#
# Layered on top of the existing objective exactly like the theory penalties
# above — same mechanism (BoolVar x coefficient, summed and subtracted), same
# guarantee that BIG_M placement always dominates.
#
ONLINE_PENALTY = 30  # any session delivered online (medium-to-high)
SAT_LECTURE_PENALTY = 10  # any session placed on Saturday (medium), per-lecture

# Local (1-based) slot numbers used by the paired-classroom preference (2).
THEORY_PAIRED_SLOT_STARTS = [1, 3, 6, 8, 10]

# Local (1-based) slot numbers treated as "early" / "late" for rules (3) / (4).
THEORY_EARLY_SLOTS = {1, 2}
THEORY_LATE_SLOTS = {10, 11}

# ── Compactness soft-constraint penalty weights (schedulers/compactness/) ────
#
# Same mechanism/guarantee as the theory penalties above: layered on top of
# the objective as small BoolVar/IntVar coefficients, always dominated by
# BIG_M placement. These target the two most common real-world complaints
# about generated timetables — idle gaps between classes, and lectures of
# the same course bunched onto consecutive days.
#
FACULTY_GAP_PENALTY = 15  # per idle slot between a faculty's classes on a day
ENTITY_GAP_PENALTY = 12  # per idle slot between a division/batch's classes on a day
COURSE_SPREAD_PENALTY = 15  # same entity+course landing on two consecutive days

# Soft cap on a faculty's total scheduled slots in one day — comfortably
# below the ~8 usable slots/day (time_slots_per_day − 1 lunch slot), so a
# faculty can still fill a full day if unavoidable, but the solver prefers
# spreading their load out.
FACULTY_DAILY_LOAD_CAP = 6
FACULTY_LOAD_CAP_PENALTY = 12  # per slot over FACULTY_DAILY_LOAD_CAP
