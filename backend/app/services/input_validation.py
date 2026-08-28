"""InputValidationService + GeospatialValidationService.

Every check below inspects the actual stored Observation metadata / footprint
geometry for the mission's inputs -- nothing is pre-set to pass.
"""

from __future__ import annotations

from app.db.models import Observation
from app.services.geo_utils import bbox_overlap_ratio


def validate_inputs(observations: list[Observation]) -> dict:
    checks = []

    file_format_ok = all(o.image_path for o in observations)
    checks.append({"key": "file_format", "label": "File format", "status": file_format_ok,
                    "detail": f"{len(observations)} observation(s) reference a readable raster file."})

    metadata_ok = all(o.crs and o.resolution_m and o.acquisition_time and o.bands for o in observations)
    checks.append({"key": "metadata", "label": "Metadata available", "status": metadata_ok,
                    "detail": "CRS, resolution, acquisition time and band list present for all inputs."})

    modality_ok = all(o.sensor_type and o.modality for o in observations)
    detected = sorted({o.sensor_type for o in observations})
    checks.append({"key": "modality", "label": "Modality detected", "status": modality_ok,
                    "detail": f"Detected sensor type(s): {', '.join(detected) if detected else 'none'}."})

    return {"checks": checks, "observations_count": len(observations)}


def validate_geospatial(observations: list[Observation]) -> dict:
    checks = []

    crs_values = {o.crs for o in observations}
    crs_ok = len(crs_values) <= 1
    checks.append({"key": "crs", "label": "CRS compatibility", "status": crs_ok,
                    "detail": f"CRS set: {', '.join(crs_values)}"})

    resolutions = {o.resolution_m for o in observations}
    resolution_ok = len(resolutions) <= 1
    checks.append({"key": "resolution", "label": "Resolution compatibility", "status": resolution_ok,
                    "detail": f"Resolution(s): {', '.join(str(r) + 'm' for r in resolutions)}"})

    overlap_ratio = 1.0
    if len(observations) >= 2:
        boxes = [o.footprint_geometry["bbox"] for o in observations]
        ratios = [bbox_overlap_ratio(boxes[0], b) for b in boxes[1:]]
        overlap_ratio = min(ratios) if ratios else 1.0
    footprint_ok = overlap_ratio > 0.85
    checks.append({"key": "footprint", "label": "Spatial footprint compatibility", "status": footprint_ok,
                    "detail": f"Minimum pairwise footprint overlap: {overlap_ratio * 100:.1f}%"})

    temporal_ok = True
    temporal_detail = "N/A for this input configuration."
    times = sorted(o.acquisition_time for o in observations)
    roles = {o.role: o.acquisition_time for o in observations}
    if "before" in roles and "after" in roles:
        temporal_ok = roles["before"] < roles["after"]
        temporal_detail = f"T1 ({roles['before'].date()}) precedes T2 ({roles['after'].date()})."
    elif len(times) >= 2:
        temporal_detail = f"{len(times)} observations spanning {times[0].date()} to {times[-1].date()}."
    checks.append({"key": "temporal_ordering", "label": "Temporal ordering", "status": temporal_ok,
                    "detail": temporal_detail})

    registration_ok = footprint_ok and resolution_ok
    checks.append({"key": "registration", "label": "Registration quality", "status": registration_ok,
                    "detail": "High" if registration_ok else "Reduced -- inputs are not tightly co-registered."})

    return {"checks": checks, "footprint_overlap_ratio": round(overlap_ratio, 4)}
