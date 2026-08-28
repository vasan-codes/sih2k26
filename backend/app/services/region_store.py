"""Resolves a region_key to a region dict whether it's one of the 3 built-in demo
AOIs (demo_data.scenarios.REGIONS) or a custom region created from user-uploaded
imagery (RegionRecord table). Every other module should go through this instead of
touching REGIONS or RegionRecord directly, so upload support doesn't require
touching orchestrator/routes call sites more than once.
"""

from __future__ import annotations

import random
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.db.models import RegionRecord
from app.demo_data.scenarios import REGIONS

# Non-georeferenced uploads have no real coordinates. We assign a placeholder AOI
# footprint (clearly labeled as such) purely so the GIS map/overlay math -- built
# around a bbox -- still has something to render against.
_PLACEHOLDER_BASE_BBOX = [77.550, 12.930, 77.600, 12.980]


def resolve_region(db: Session, key: str) -> dict:
    if key in REGIONS:
        return REGIONS[key]
    row = db.get(RegionRecord, key)
    if not row:
        raise ValueError(f"Unknown region '{key}'")
    return {"label": row.label, "description": row.description, "bbox": row.bbox, "modes": row.modes}


def region_exists(db: Session, key: str) -> bool:
    return key in REGIONS or db.get(RegionRecord, key) is not None


def create_custom_region(db: Session, mode: str) -> str:
    key = f"custom-{uuid.uuid4().hex[:8]}"
    jitter = random.Random(key).uniform(-0.15, 0.15)
    bbox = [round(v + jitter, 4) for v in _PLACEHOLDER_BASE_BBOX]
    row = RegionRecord(
        key=key,
        label=f"Custom Upload — {datetime.now(timezone.utc):%Y-%m-%d %H:%M UTC}",
        description=(
            "User-uploaded observation set. No external georeference was provided with the "
            "upload, so a placeholder AOI footprint is used for spatial visualization only -- "
            "it does not represent the imagery's real-world location."
        ),
        bbox=bbox,
        modes=[mode],
        is_custom=True,
    )
    db.add(row)
    db.commit()
    return key


def list_all_regions(db: Session) -> list[dict]:
    out = [{"key": k, **v} for k, v in REGIONS.items()]
    for row in db.query(RegionRecord).order_by(RegionRecord.created_at.desc()).all():
        out.append({"key": row.key, "label": row.label, "description": row.description, "bbox": row.bbox, "modes": row.modes})
    return out
