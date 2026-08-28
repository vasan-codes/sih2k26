from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.models import ExternalObservation, Observation
from app.db.session import get_db
from app.demo_data.scenarios import OPTICAL_SAR, REGIONS
from app.schemas.schemas import CorrelationOut, ExternalObservationOut, RegionOut
from app.services.correlation import correlate_external_signal

router = APIRouter(prefix="/api/regions", tags=["regions"])


@router.get("", response_model=list[RegionOut])
def api_list_regions(db: Session = Depends(get_db)):
    out = []
    for key, region in REGIONS.items():
        obs = db.query(Observation).filter(Observation.region_key == key).all()
        out.append(RegionOut(key=key, observations=obs, **region))
    return out


@router.get("/{region_key}", response_model=RegionOut)
def api_get_region(region_key: str, db: Session = Depends(get_db)):
    if region_key not in REGIONS:
        raise HTTPException(404, "Unknown region")
    obs = db.query(Observation).filter(Observation.region_key == region_key).all()
    return RegionOut(key=region_key, observations=obs, **REGIONS[region_key])


@router.get("/{region_key}/external-observations", response_model=list[ExternalObservationOut])
def api_external_observations(region_key: str, db: Session = Depends(get_db)):
    return (
        db.query(ExternalObservation)
        .filter(ExternalObservation.region_key == region_key)
        .order_by(ExternalObservation.observed_at)
        .all()
    )


@router.post("/{region_key}/correlate", response_model=CorrelationOut)
def api_correlate(region_key: str, db: Session = Depends(get_db)):
    points = (
        db.query(ExternalObservation)
        .filter(ExternalObservation.region_key == region_key)
        .order_by(ExternalObservation.observed_at)
        .all()
    )
    feature_px = None
    if region_key == OPTICAL_SAR["region_key"]:
        patch = OPTICAL_SAR["layout"]["ambiguous_patch"]
        feature_px = (patch["cx"], patch["cy"])
    corr = correlate_external_signal(points, feature_px)
    return CorrelationOut(region_key=region_key, external_points=points, **corr)
