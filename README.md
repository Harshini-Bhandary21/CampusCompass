# CampusCompass

An automated timetable generation system built for MIT Academy of Engineering (MITAOE), Alandi, Pune. Currently scoped to First Year (FY) scheduling: a coordinator uploads a Faculty/Rooms/Time Excel workbook, a constraint solver generates a conflict-free weekly timetable, and the result is browsable by faculty, room, and division.

## Architecture

Two services:

```
client/   Next.js 16 (App Router) — the website. Auth, MongoDB persistence,
          coordinator dashboard, faculty/rooms/division schedule views.

python/   FastAPI service — the actual timetable generator. Takes an Excel
          upload, runs a CP-SAT (Google OR-Tools) constraint solver, returns
          the generated schedule as JSON + writes an Excel file for download.
```

They talk over plain HTTP, not a shared package:

```
Browser
  │  upload Excel + config
  ▼
client/  (Next.js)  ──POST /schedule──▶  python/  (FastAPI, port 5000)
  │                                         │ runs CP-SAT solver
  │                                         │ writes Excel to python/storage/outputs/
  │◀──── JSON { run_id, rows, ... } ────────┘
  │
  ├─ POST /api/coordinators/get-department  → persists the schedule JSON in MongoDB
  │
  └─ GET  http://localhost:5000/download/{run_id}  → downloads the generated Excel
```

**Deliberate design rule: `python/` never talks to a database.** It's a pure Excel-in, Excel/JSON-out generator with no MongoDB/network dependency of its own — all persistence happens through `client/`'s API routes. Keep it that way; it makes the solver trivially testable and means the generator can't drift from what's actually stored.

## Getting started

You need both services running.

**1. Python backend** (from the repo root, not from inside `python/` — it's a package with relative imports):
```bash
pip install -r python/requirements.txt
python -m uvicorn python.main:app --reload --port 5000
```

**2. Next.js frontend** (from `client/`):
```bash
cd client
npm install
npm run dev
```

See `client/README.md` and `python/README.md` for service-specific details (env vars, endpoints, CLI usage).

## Project status

Only the timetable-generation deliverable is built out end-to-end (upload → generate → store → download, verified working). Several other planned features (3D campus view, pre-course survey, completion tracking, faculty leave handling, teacher dashboard, LMS calendar/analytics) are not yet started — the student dashboard has placeholder links for some of these. Check with the team before assuming any of that exists.

## Known gaps

- No automated tests existed before this pass — see `client/README.md#testing` and `python/README.md#testing` for what's there now.
- No CI/CD pipeline.
- No Dockerfile / deployment config for either service.
