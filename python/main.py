"""CLI entry point (main) and the FastAPI HTTP app (app) that the Next.js
client talks to. Route handlers live in routes/; the generator itself lives
in generator.py.

Run the API server from the project root with:
    uvicorn python.main:app --reload --port 5000
"""

import sys

# The scheduler prints Unicode symbols (✓/✗) to stdout/stderr. On Windows the
# default console codec (cp1252) can't encode them, which crashes mid-run
# when this process's output isn't a real UTF-8 terminal (e.g. under uvicorn).
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8", errors="replace")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .cli import build_arg_parser
from .core import TimetableScheduler
from .generator import generate_timetable
from .routes import download, schedule


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


# ─────────────────────────────────────────────────────────────────────────
# FastAPI HTTP app
#
# Workflow: Upload Excel → validate → convert to JSON + persist → run
# generate_timetable() → Excel export → return result JSON (with run_id) →
# frontend downloads the Excel separately via GET /download/{run_id}.
# Route handlers themselves live in routes/schedule.py and routes/download.py.
# ─────────────────────────────────────────────────────────────────────────

app = FastAPI(title="CampusCompass Timetable Generator")

# The Next.js client calls this with `mode: "cors"` from a different origin/port.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(schedule.router)
app.include_router(download.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=5000)
