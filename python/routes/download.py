"""GET /download/{run_id} — serve the generated Excel file for a completed run."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from ..storage import OUTPUT_DIR

router = APIRouter()


@router.get("/download/{run_id}")
async def download(run_id: str):
    if not run_id.isalnum():
        raise HTTPException(status_code=400, detail="Invalid run id.")

    output_path = OUTPUT_DIR / f"timetable_{run_id}.xlsx"
    if not output_path.exists():
        raise HTTPException(status_code=404, detail="Generated file not found for this run id.")

    return FileResponse(
        path=output_path,
        filename="generated_timetable.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
