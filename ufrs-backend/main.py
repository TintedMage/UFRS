"""
UFRS FastAPI Backend
====================
Serves harmonized multi-satellite wildfire data from NASA FIRMS.

Endpoints:
  GET /api/health          — Health check + FIRMS key status
  GET /api/harmonize       — Full 4-stage harmonization pipeline
  GET /api/export-csv      — Downloadable CSV of harmonized fire events
"""

import io
import os
import math
import logging
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from services.harmonizer import (
    run_full_pipeline,
    get_harmonized_csv_df,
    sanitize_bbox,
    point_to_bbox,
)

# ---------------------------------------------------------------------------
# Environment & API Key Resolution
# ---------------------------------------------------------------------------
# Try multiple .env locations
for env_path in [
    os.path.join(os.path.dirname(__file__), ".env"),
    os.path.join(os.path.dirname(__file__), "..", ".env"),
    "/home/tinted/Projects/UFRS/.env",
]:
    if os.path.exists(env_path):
        load_dotenv(env_path)

FIRMS_MAP_KEY = os.getenv("FIRMS_MAP_KEY", "")

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
logger = logging.getLogger("ufrs.api")

# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="UFRS Backend — Unified Fire Reconnaissance System",
    description="Multi-satellite wildfire harmonization engine for NASA FIRMS data.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _resolve_bbox(bbox, lat, lon, radius_km):
    """Resolve the bounding box from either explicit bbox or lat/lon + radius_km."""
    if bbox:
        return sanitize_bbox(bbox)
    if lat is not None and lon is not None:
        return point_to_bbox(lat, lon, radius_km)
    # Default: Park Fire region
    return point_to_bbox(39.910, -121.823, 50.0)


# ---------------------------------------------------------------------------
# GET /api/health
# ---------------------------------------------------------------------------
@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "firms_key_configured": bool(FIRMS_MAP_KEY),
    }


# ---------------------------------------------------------------------------
# GET /api/harmonize
# ---------------------------------------------------------------------------
@app.get("/api/harmonize")
async def harmonize(
    bbox: Optional[str] = Query(None, description="west,south,east,north"),
    lat: Optional[float] = Query(None, description="Center latitude"),
    lon: Optional[float] = Query(None, description="Center longitude"),
    radius_km: float = Query(50.0, description="Radius in km (used with lat/lon)"),
    target_date: str = Query("2024-07-26", description="Target date YYYY-MM-DD"),
    force_refresh: bool = Query(False, description="Bypass disk cache"),
):
    try:
        resolved_bbox = _resolve_bbox(bbox, lat, lon, radius_km)
        logger.info("Harmonize request: bbox=%s, target_date=%s, force=%s", resolved_bbox, target_date, force_refresh)
        payload = run_full_pipeline(resolved_bbox, target_date, FIRMS_MAP_KEY, force_refresh)
        return JSONResponse(content=payload)
    except Exception as exc:
        logger.exception("Harmonize endpoint error")
        return JSONResponse(
            status_code=500,
            content={"error": str(exc)},
        )


# ---------------------------------------------------------------------------
# GET /api/export-csv
# ---------------------------------------------------------------------------
@app.get("/api/export-csv")
async def export_csv(
    bbox: Optional[str] = Query(None, description="west,south,east,north"),
    lat: Optional[float] = Query(None, description="Center latitude"),
    lon: Optional[float] = Query(None, description="Center longitude"),
    radius_km: float = Query(50.0, description="Radius in km (used with lat/lon)"),
    target_date: str = Query("2024-07-26", description="Target date YYYY-MM-DD"),
    fire_date_local: Optional[str] = Query(None, description="Filter by fire_date_local"),
    daynight: Optional[str] = Query(None, description="Filter by D or N"),
):
    try:
        resolved_bbox = _resolve_bbox(bbox, lat, lon, radius_km)
        df = get_harmonized_csv_df(resolved_bbox, target_date, FIRMS_MAP_KEY, fire_date_local, daynight)

        buf = io.StringIO()
        df.to_csv(buf, index=False)
        buf.seek(0)

        filename = f"harmonized_fire_hotspots_{target_date}.csv"
        return StreamingResponse(
            iter([buf.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as exc:
        logger.exception("Export CSV endpoint error")
        return JSONResponse(
            status_code=500,
            content={"error": str(exc)},
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
