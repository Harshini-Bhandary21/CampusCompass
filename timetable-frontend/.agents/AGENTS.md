# CampusCompass ATS Project Rules & Context

Welcome, Antigravity. This workspace is set up with an integrated React/TanStack Start frontend and a Python Flask/OR-Tools CP-SAT scheduler backend.

## Environment & Commands

- **Frontend Development Server**:
  - Command: `npm run dev` (starts Vite on port `8080`).
- **Backend Solver Server**:
  - Command: `python -u backend/app.py` (starts Flask on port `5000` with unbuffered logging).
  - Main solver logic resides in `backend/tt.py`.
- **Git Remotes**:
  - `origin`: `https://github.com/SarthakPatil18/campus-wise-flow-56.git` (connected to Lovable, do not force-push).
  - `fork`: `https://github.com/SarthakPatil18/campusCompass.git`.

## Architecture & Integration Details

1. **Solver Request**:
   - The frontend's AI Processing wizard triggers `runSolver()` (in `src/hooks/useCampusData.tsx`).
   - It sends a multipart `FormData` POST request containing the `file` to `http://localhost:5000/schedule`.
   - If no file is uploaded, the frontend automatically falls back to fetching `public/FY.xlsx`.
2. **Input Sheets Constraint**:
   - The CP-SAT solver expects the input Excel file to contain specific configuration sheets: `Faculty`, `Rooms`, and `Time`.
   - Do NOT use `FY_TT.xlsx` (the generated output) as a solver input since it lacks these configuration sheets. Always use the template configuration layout `FY.xlsx` for scheduling runs.
3. **Timetable Data Mapping**:
   - The solver returns an optimized JSON response containing `rows` of class events.
   - The frontend parses this via `importMasterTimetable` which maps the events to all student cohort timetables in the React context state.
4. **Cohort Selection**:
   - A cohort select dropdown has been added on the top left of the `/timetables` page actions bar so the user can toggle the active cohort view (switching between `A11`, `A12`, `CS1`, etc.) dynamically.
5. **Excel Download**:
   - A "Download Excel" button appears in the action bar of the `/timetables` route linking directly to `http://localhost:5000/download/{run_id}`.
