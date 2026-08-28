"""Populates the model registry, demo observation catalog, external-signal dataset,
and (optionally) pre-runs the three demo missions through the real orchestrator so the
Dashboard / Mission History / Region Intelligence screens have genuine data on first load.

Run with: ./venv/Scripts/python.exe seed.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.db.base import Base
from app.db.models import ExternalObservation, Mission, ModelRegistryEntry, Observation
from app.db.session import SessionLocal, engine
from app.demo_data.generate_imagery import IMG_SIZE, generate_all
from app.demo_data.model_registry_seed import MODEL_REGISTRY_SEED
from app.demo_data.scenarios import BI_TEMPORAL, EXTERNAL_SIGNAL, OPTICAL_SAR, REGIONS, SINGLE_IMAGE
from app.orchestration.orchestrator import run_mission_pipeline
from app.services.geo_utils import bbox_polygon
from datetime import datetime, timedelta, timezone


def seed_model_registry(db) -> None:
    if db.query(ModelRegistryEntry).count() > 0:
        return
    for entry in MODEL_REGISTRY_SEED:
        db.add(ModelRegistryEntry(status="available", **entry))
    db.commit()
    print(f"Seeded {len(MODEL_REGISTRY_SEED)} model registry entries.")


def _make_observation(region_key: str, role: str, cfg: dict) -> Observation:
    bbox = REGIONS[region_key]["bbox"]
    return Observation(
        region_key=region_key,
        name=cfg["name"],
        sensor_type=cfg["sensor_type"],
        modality=cfg["modality"],
        role=role,
        acquisition_time=cfg["acquisition_time"],
        crs=cfg["crs"],
        resolution_m=cfg["resolution_m"],
        bands=cfg["bands"],
        footprint_geometry=bbox_polygon(bbox),
        image_path=cfg["image_file"],
        width=IMG_SIZE,
        height=IMG_SIZE,
    )


def seed_observations(db) -> None:
    if db.query(Observation).count() > 0:
        return
    db.add(_make_observation(BI_TEMPORAL["region_key"], "before", BI_TEMPORAL["t1"]))
    db.add(_make_observation(BI_TEMPORAL["region_key"], "after", BI_TEMPORAL["t2"]))
    db.add(_make_observation(OPTICAL_SAR["region_key"], "optical", OPTICAL_SAR["optical"]))
    db.add(_make_observation(OPTICAL_SAR["region_key"], "sar", OPTICAL_SAR["sar"]))
    db.add(_make_observation(SINGLE_IMAGE["region_key"], "single", SINGLE_IMAGE["observation"]))
    db.commit()
    print("Seeded observation catalog (5 observations across 3 demo regions).")


def seed_external_observations(db) -> None:
    if db.query(ExternalObservation).count() > 0:
        return
    base_time = datetime(2024, 9, 1, tzinfo=timezone.utc)
    for offset, value, geo in EXTERNAL_SIGNAL["points"]:
        db.add(ExternalObservation(
            region_key=EXTERNAL_SIGNAL["region_key"],
            source=EXTERNAL_SIGNAL["source"],
            signal_type=EXTERNAL_SIGNAL["signal_type"],
            observed_at=base_time + timedelta(days=offset),
            geometry=geo,
            value=float(value),
            unit=EXTERNAL_SIGNAL["unit"],
            notes="Synthetic demo dataset -- not a real ecological survey.",
        ))
    db.commit()
    print(f"Seeded {len(EXTERNAL_SIGNAL['points'])} external observation points.")


DEMO_MISSIONS = [
    {
        "mode": "bi_temporal", "region_key": BI_TEMPORAL["region_key"],
        "query_text": "Has the built-up area increased between these dates, and where?",
        "title": "Demo Mission — Riverside Corridor Built-Up Change",
    },
    {
        "mode": "optical_sar", "region_key": OPTICAL_SAR["region_key"],
        "query_text": "Verify the water extent in this wetland using SAR and flag any disagreement.",
        "title": "Demo Mission — Coastal Wetland Optical+SAR Verification",
    },
    {
        "mode": "single_image", "region_key": SINGLE_IMAGE["region_key"],
        "query_text": "Describe the agricultural activity in this image and highlight the water body.",
        "title": "Demo Mission — Agricultural Mosaic Scene Analysis",
    },
]


def seed_demo_missions(db) -> None:
    if db.query(Mission).count() > 0:
        return
    for cfg in DEMO_MISSIONS:
        mission = Mission(
            title=cfg["title"], query_text=cfg["query_text"], mode=cfg["mode"],
            region_key=cfg["region_key"], status="running", is_demo=True,
        )
        db.add(mission)
        db.commit()
        db.refresh(mission)
        run_mission_pipeline(db, mission)
        print(f"Ran demo mission: {mission.title} -> status={mission.status}")


def main():
    Base.metadata.create_all(bind=engine)
    generated = generate_all()
    if generated:
        print(f"Generated demo imagery: {generated}")
    else:
        print("Demo imagery already present.")

    db = SessionLocal()
    try:
        seed_model_registry(db)
        seed_observations(db)
        seed_external_observations(db)
        seed_demo_missions(db)
    finally:
        db.close()
    print("Seeding complete.")


if __name__ == "__main__":
    main()
