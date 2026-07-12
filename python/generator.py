"""Flask/FastAPI entry point for the timetable generator.

Kept separate from main.py (the CLI + FastAPI app) so routes/schedule.py can
import generate_timetable() without a circular import back into main.py.
"""

from .core import TimetableScheduler


def generate_timetable(excel_path: str, output_path: str = None) -> dict:
    """
    Mirrors the exact sequence used in main.main() so all solver
    configuration, iterative repair, and LNS passes are applied.

    Returns a dict with:
      success       : bool
      scheduled     : int   — sessions placed
      total         : int   — sessions attempted
      rows          : list  — timetable rows (Overview sheet format)
      unscheduled   : list  — sessions that could not be placed
      error         : str   — only present on failure
    """
    s = TimetableScheduler()
    s.online_days = [0, 0, 0, 0, 0, 1]  # Saturday = online, matches main()

    if not s.load_data(excel_path):
        return {
            "success": False,
            "error": "Failed to load Excel data. Check sheet names: Faculty, Rooms, Time.",
        }

    if not s.parse_sessions():
        return {
            "success": False,
            "error": "Failed to parse sessions from Faculty sheet.",
        }

    s.feasibility_report()

    if not s.build_model():
        return {"success": False, "error": "Failed to build CP-SAT model."}

    # Match the worker count used in main() (8 is the default)
    s.solver.parameters.num_search_workers = 8

    # Run iterative repair — this is the correct entry point, NOT solver.Solve()
    solved = s.iterative_repair(
        max_iterations=5,
        time_limit=300,  # 5 min cap per pass; keeps the request alive
        use_hints=True,
        lns_freeze_ratio=0.95,
        lns_start_pass=3,
    )

    if not solved:
        return {
            "success": False,
            "error": "Solver could not find a feasible solution. Check feasibility report output.",
        }

    # Extract the placed sessions as a list of row dicts
    solution = s.extract_solution()

    # Optionally write the Excel file (used for download endpoint)
    if output_path:
        s.save_timetable(solution, output_path)

    # ── CT-DISP: single canonical display schedule ──────────────────────
    # build_display_schedule() is the same function save_timetable() uses
    # to build the Excel Overview / E_* sheets (raw sessions + generic CT
    # placeholder rows for every FY division). Using it here too means the
    # payload returned over HTTP — and whatever gets persisted to MongoDB
    # from it — is byte-for-byte the same processed timetable as the Excel
    # file, so the website and the Excel file never diverge again.
    display_schedule = s.build_display_schedule(solution)

    # Build unscheduled list for the response
    unscheduled = [
        {
            "faculty": sess["faculty"],
            "course": sess["course"],
            "label": sess["label"],
            "type": sess["type"],
        }
        for sess in s.sessions
        if s.solver.Value(sess["placed_var"]) == 0
    ]

    return {
        "success": True,
        "scheduled": len(solution),
        "total": len(s.sessions),
        "rows": display_schedule,  # list of dicts: Day, Time, Faculty, Course, ... — same processed schedule as the Excel Overview sheet
        "unscheduled": unscheduled,
    }
