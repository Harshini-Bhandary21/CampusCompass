# CampusCompass — python

FastAPI service that generates FY timetables with a CP-SAT (Google OR-Tools) constraint solver. See the [root README](../README.md) for how this fits with `client/`.

**This service has no database of its own and never will by design** — it's Excel-in, Excel/JSON-out. All persistence (storing the generated schedule) happens in `client/`'s API routes. If you find yourself wanting to add a MongoDB call here, stop — that logic belongs in `client/` instead.

## Setup

```bash
pip install -r requirements.txt
```

## Running

**As the HTTP API** (what `client/` actually talks to) — run from the **repo root**, not from inside `python/` (it's a package using relative imports):

```bash
uvicorn python.main:app --reload --port 5000
```

**As a standalone CLI** (generate one timetable from the command line, no HTTP):

```bash
python python/main.py --input FY.xlsx --output FY_TT.xlsx
```
Run `python python/main.py --help` for all flags (time limit, worker count, LNS tuning).

## HTTP API

- `POST /schedule` — multipart form: `file` (the Excel workbook), `department`, `onlineConfig` (JSON string), `facultyAvailability` (JSON string). Runs the full generation pipeline synchronously (in a worker thread, so it doesn't block other requests) and returns `{success, scheduled, total, rows, unscheduled, run_id}`.
- `GET /download/{run_id}` — streams back the generated `.xlsx` for a completed run.

Interactive docs at `http://localhost:5000/docs` once the server is running.

## Package layout

```
main.py          FastAPI app + CLI entry point (main())
generator.py      generate_timetable() — the actual pipeline, called by both main() and the /schedule route
storage.py        shared UPLOAD_DIR/OUTPUT_DIR/DATA_DIR paths
routes/           HTTP route handlers (schedule.py, download.py)
core/             TimetableScheduler — data loading, CP-SAT model building, solving, Excel export
schedulers/       CT (counselling/tutorial) allocation, theory soft constraints, LNS repair
config/           static config: division→batch mapping, CT day matrix, room mappings, objective weights
utils/            small shared helpers
storage/          runtime output — uploaded files, generated Excel files, persisted JSON per run (gitignored)
```

`static.txt` is a hand-maintained audit of every hardcoded/static value in this package (division lists, CT day assignments, objective weights, solver parameters, etc.) — check it before assuming something is read from the Excel file when it's actually a fixed constant.

## Input format

The uploaded Excel workbook needs sheets: `Faculty` (required — `Name of Faculty`, `Course Name`, `TH`, `PR/TU`, `Division`, `Batch` columns), `Rooms` (required — `Rooms`, `Type`, `Subject`), `Time` (required — `Index`, `Slot`), `CT_Rooms` (optional — `Batch`, `Room`).

## Testing

```bash
pip install -r requirements-dev.txt
pytest   # run from the repo root, not from inside python/
```

Coverage is intentionally minimal right now (first pass at adding tests to a codebase that had none) — see `tests/`. The solver itself is expensive to test end-to-end (a real solve takes minutes), so tests focus on the pure/fast pieces: JSON conversion, storage paths, CT matrix validation, division/batch helpers.

## Known constraints

- Solver is CPU-only — CP-SAT has no GPU acceleration. Speed is tuned via `num_search_workers`, `time_limit`, and `max_iterations` (see `core/solve.py` and `generator.py`).
- Windows: stdout/stderr are reconfigured to UTF-8 in `main.py` because the scheduler prints Unicode symbols (✓/✗) that crash under Windows' default console codec otherwise.
