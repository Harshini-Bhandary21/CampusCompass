# CampusCompass — client

Next.js 16 (App Router, JavaScript) frontend for CampusCompass. Auth, MongoDB persistence, and the coordinator dashboard for FY timetable generation. See the [root README](../README.md) for how this fits together with the `python/` generator service.

## Setup

```bash
npm install
cp .env.example .env   # then fill in the real values
npm run dev
```

Runs at [http://localhost:3000](http://localhost:3000).

### Required environment variables

See `.env.example` for the full list with descriptions. At minimum you need `MONGODB_URI`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, and `NEXT_PUBLIC_API_URL`/`FLASK_URL` pointing at the running `python/` service (default `http://localhost:5000`).

## Architecture notes

- **Auth**: NextAuth v5 (`auth.js`), credentials-based, three roles — `admin` (department coordinator, despite the role name), `teacher`, `student`. Session/JWT carries `role`, `department`, `university`.
- **Routing**: `app/firstyear/*` is a static route tree (not a dynamic `[department]` segment) — this project is scoped to a single department, "First Year". Don't reintroduce dynamic department routing without discussing it first; `app/components/dashboard/DepartmentSidebarConfig.jsx` hardcodes the `/firstyear/*` paths.
- **Schedule generation flow**: the dashboard (`app/firstyear/dashboard/page.jsx`) uploads an Excel file directly to the `python/` FastAPI service (`NEXT_PUBLIC_API_URL`/schedule), then POSTs the returned JSON to `/api/coordinators/get-department` to persist it in MongoDB, then downloads the generated Excel from the Python service's `/download/{run_id}`. `client/`'s own API routes never talk to the Python service on the generation path except by proxying — the browser calls Python directly.
- **Data model**: a single `universities` collection in MongoDB. Each university document has a `departments` array; each department has a `coordinator` sub-object (the login identity) and holds `selectedSchedule`, `timetableData`, `onlineConfig`, `facultyAvailability`.

## Testing

Vitest + React Testing Library. Run with:

```bash
npm test
```

Tests are co-located next to the code they cover (`*.test.js`/`*.test.jsx`/`*.test.ts`), not in a separate `__tests__/` tree. Coverage is intentionally minimal right now (this is the first pass at adding tests to a codebase that had none) — see `lib/utils.test.ts` and `app/components/dashboard/TimetableGrid.test.jsx`. Add tests alongside new features rather than treating this as done.

## Known issues / TODO

- `app/videos/page.tsx` has a pre-existing type mismatch between the component and `data/videos.json` (component expects `{id, url}`, data has `{title, file}`) — not yet fixed.
- Several planned features (3D campus view, pre-course survey, completion tracking, faculty leave handling, teacher dashboard, LMS calendar) are not built — see the root README's "Project status" section.
