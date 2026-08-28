"""Accepts real user-uploaded satellite imagery (the INPUT DATA stage of the
workflow) and turns it into an Observation the rest of the pipeline can analyze
exactly like the built-in demo imagery -- same metadata shape, same static file
serving, same orchestrator code path.
"""

from __future__ import annotations

import io
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from PIL import Image
from sqlalchemy.orm import Session

from app.db.models import Observation
from app.db.session import get_db
from app.demo_data.generate_imagery import STATIC_DIR
from app.demo_data.scenarios import IMG_SIZE
from app.schemas.schemas import ObservationOut
from app.services.geo_utils import bbox_polygon
from app.services.region_store import create_custom_region, region_exists, resolve_region

router = APIRouter(prefix="/api", tags=["uploads"])

ALLOWED_ROLES = {"single", "before", "after", "optical", "sar"}
ALLOWED_SENSORS = {"optical", "sar", "multispectral"}
UPLOAD_DIR = STATIC_DIR / "uploads"


@router.post("/observations/upload", response_model=ObservationOut)
async def upload_observation(
    file: UploadFile = File(...),
    role: str = Form(...),
    mode: str = Form(...),
    sensor_type: str = Form("optical"),
    acquisition_date: str | None = Form(None),
    region_key: str | None = Form(None),
    db: Session = Depends(get_db),
):
    if role not in ALLOWED_ROLES:
        raise HTTPException(400, f"Invalid role '{role}'. Must be one of {sorted(ALLOWED_ROLES)}.")
    if sensor_type not in ALLOWED_SENSORS:
        raise HTTPException(400, f"Invalid sensor_type '{sensor_type}'. Must be one of {sorted(ALLOWED_SENSORS)}.")

    content = await file.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(400, "File too large (25MB limit).")
    try:
        img = Image.open(io.BytesIO(content))
        img.load()
    except Exception:
        raise HTTPException(400, "Uploaded file is not a valid, readable image.")

    is_sar = sensor_type == "sar"
    img = img.convert("L") if is_sar else img.convert("RGB")
    # Uploaded imagery arrives at whatever resolution/aspect the user provided; it's
    # resized to the platform's standard working grid so the same pixel-level
    # analysis (thresholding, hotspot clustering, geo-overlay math) applies uniformly
    # to demo and uploaded observations alike.
    img = img.resize((IMG_SIZE, IMG_SIZE), Image.LANCZOS)

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    fname = f"upload_{uuid.uuid4().hex[:12]}.png"
    img.save(UPLOAD_DIR / fname)
    image_path = f"uploads/{fname}"

    if region_key:
        if not region_exists(db, region_key):
            raise HTTPException(404, f"Unknown region_key '{region_key}'")
    else:
        region_key = create_custom_region(db, mode)

    if acquisition_date:
        try:
            acq_dt = datetime.fromisoformat(acquisition_date)
        except ValueError:
            raise HTTPException(400, f"Invalid acquisition_date '{acquisition_date}', expected ISO format.")
        if acq_dt.tzinfo is None:
            acq_dt = acq_dt.replace(tzinfo=timezone.utc)
    else:
        acq_dt = datetime.now(timezone.utc)

    modality = "C-band SAR (VV)" if is_sar else "multispectral (R,G,B)"
    bands = ["VV"] if is_sar else ["Red", "Green", "Blue"]
    region = resolve_region(db, region_key)

    obs = Observation(
        region_key=region_key,
        name=file.filename or f"Uploaded {role} observation",
        sensor_type=sensor_type,
        modality=modality,
        role=role,
        acquisition_time=acq_dt,
        crs="EPSG:4326",
        resolution_m=10.0,
        bands=bands,
        footprint_geometry=bbox_polygon(region["bbox"]),
        preprocessing="User-uploaded imagery, resized to the platform's 512x512 working grid. No radiometric calibration applied.",
        image_path=image_path,
        width=IMG_SIZE,
        height=IMG_SIZE,
    )
    db.add(obs)
    db.commit()
    db.refresh(obs)
    return obs
