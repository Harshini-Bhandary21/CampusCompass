"""CLI entry point (main) and Flask entry point (generate_timetable)."""

from .cli import build_arg_parser
from .core import TimetableScheduler


def main():
    args = build_arg_parser().parse_args()

    s = TimetableScheduler()
    s.online_days = [0, 0, 0, 0, 0, 1]

    if not s.load_data(args.input):
        return
    if not s.parse_sessions():
        return
    s.feasibility_report()
    if not s.build_model():
        return

    s.solver.parameters.num_search_workers = args.workers

    use_hints = not args.no_hints
    if s.iterative_repair(
        max_iterations=args.max_iterations,
        time_limit=args.time_limit,
        use_hints=use_hints,
        lns_freeze_ratio=args.lns_freeze_ratio,
        lns_start_pass=args.lns_start_pass,
    ):
        sol = s.extract_solution()
        s.save_timetable(sol, args.output)
        print("\n" + "=" * 70)
        print(f"  SUCCESS — {args.output} generated")
        print("=" * 70)
    else:
        print("\nFailed. Check feasibility report above.")


def generate_timetable(excel_path: str, output_path: str = None) -> dict:
    """
    Flask entry point for the timetable generator.

    Mirrors the exact sequence used in main() so all solver
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
        time_limit=300,  # 5 min cap per pass; keeps Flask request alive
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
    # payload returned to Flask — and whatever gets persisted to MongoDB
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


if __name__ == "__main__":
    main()
