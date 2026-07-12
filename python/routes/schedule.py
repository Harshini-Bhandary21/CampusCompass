"""POST /schedule — upload Excel, persist it as JSON, run generation, export Excel."""

import json
import uuid

import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool

from ..generator import generate_timetable
from ..storage import DATA_DIR, OUTPUT_DIR, UPLOAD_DIR

router = APIRouter()


def _excel_to_json(path) -> dict:
    """Convert every sheet in the uploaded workbook into plain JSON-serializable rows."""
    try:
        sheets = pd.read_excel(path, sheet_name=None)
    except Exception as exc:
        raise ValueError(f"Could not parse Excel file: {exc}") from exc

    return {name: json.loads(df.to_json(orient="records")) for name, df in sheets.items()}


@router.post("/schedule")
async def schedule(
    file: UploadFile = File(...),
    department: str = Form(default="First Year"),
    onlineConfig: str = Form(default="{}"),
    facultyAvailability: str = Form(default="{}"),
):
    # ---- Missing / invalid file ----
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")
    if not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type — please upload an Excel (.xlsx) file.",
        )

    run_id = uuid.uuid4().hex[:8]
    input_path = UPLOAD_DIR / f"input_{run_id}.xlsx"
    output_path = OUTPUT_DIR / f"timetable_{run_id}.xlsx"

    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        input_path.write_bytes(contents)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to save uploaded file: {exc}")

    # ---- Convert uploaded Excel to JSON and persist it, alongside the
    # submitted configuration, so the raw input is available for future use
    # even before (or regardless of whether) generation succeeds. ----
    try:
        sheets_json = await run_in_threadpool(_excel_to_json, input_path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    try:
        online_config = json.loads(onlineConfig) if onlineConfig else {}
    except json.JSONDecodeError:
        online_config = {}
    try:
        faculty_availability = json.loads(facultyAvailability) if facultyAvailability else {}
    except json.JSONDecodeError:
        faculty_availability = {}

    record = {
        "run_id": run_id,
        "department": department,
        "onlineConfig": online_config,
        "facultyAvailability": faculty_availability,
        "sheets": sheets_json,
    }
    data_path = DATA_DIR / f"{run_id}.json"
    try:
        data_path.write_text(json.dumps(record, indent=2, default=str))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to persist uploaded data: {exc}")

    # ---- Run timetable generation (processing + generation failure) ----
    # generate_timetable() is a long-running, CPU-bound, blocking call — run it
    # in a worker thread so it doesn't freeze the event loop for every other
    # request (including this server's own health checks and downloads).
    try:
        result = await run_in_threadpool(
            generate_timetable, str(input_path), output_path=str(output_path)
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Timetable generation crashed: {exc}")

    if not result.get("success"):
        raise HTTPException(
            status_code=422, detail=result.get("error", "Timetable generation failed.")
        )

    # ---- Export failure ----
    if not output_path.exists():
        raise HTTPException(
            status_code=500,
            detail="Timetable generated but Excel export failed — output file missing.",
        )

    # Persist the generation result into the same JSON record for future reference.
    record["result"] = {
        "success": result["success"],
        "scheduled": result["scheduled"],
        "total": result["total"],
        "unscheduled": result["unscheduled"],
    }
    try:
        data_path.write_text(json.dumps(record, indent=2, default=str))
    except Exception:
        pass  # best-effort — generation already succeeded, don't fail the request over this

    result["run_id"] = run_id
    return result
