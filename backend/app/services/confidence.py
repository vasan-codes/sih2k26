"""ConfidenceService -- composes an explicit, explainable confidence score.

PROTOTYPE CONFIDENCE ESTIMATION: this is a transparent weighted composition, not a
calibrated statistical model. Every component is computed from real upstream
signals (validation pass rate, evidence strength, footprint overlap, etc.), and the
weights are fixed and disclosed here rather than hidden inside a black box.
"""

from __future__ import annotations

WEIGHTS = {
    "model_confidence": 0.20,
    "evidence_strength": 0.25,
    "input_quality": 0.20,
    "spatial_consistency": 0.15,
    "temporal_consistency": 0.10,
    "cross_sensor_agreement": 0.10,
}

BASELINE_MODEL_CONFIDENCE = 0.78  # fixed prototype baseline per spec -- not a trained calibration


def estimate_confidence(
    evidence_items: list[dict],
    input_checks: list[dict],
    geo_checks: list[dict],
    footprint_overlap_ratio: float,
    cross_modal: dict | None,
    evidence_validation_status: str,
) -> dict:
    evidence_strength = (
        sum(e["strength"] for e in evidence_items) / len(evidence_items) if evidence_items else 0.0
    )

    all_checks = input_checks + geo_checks
    input_quality = sum(1 for c in all_checks if c["status"]) / len(all_checks) if all_checks else 0.0

    spatial_consistency = min(1.0, footprint_overlap_ratio)

    temporal_check = next((c for c in geo_checks if c["key"] == "temporal_ordering"), None)
    temporal_consistency = 1.0 if (temporal_check is None or temporal_check["status"]) else 0.4

    if cross_modal is None:
        cross_sensor_agreement = 1.0  # N/A -- single-sensor input, not penalized
    else:
        cross_sensor_agreement = max(0.0, 1.0 - cross_modal["conflict_ratio"])

    components = {
        "model_confidence": round(BASELINE_MODEL_CONFIDENCE, 3),
        "evidence_strength": round(evidence_strength, 3),
        "input_quality": round(input_quality, 3),
        "spatial_consistency": round(spatial_consistency, 3),
        "temporal_consistency": round(temporal_consistency, 3),
        "cross_sensor_agreement": round(cross_sensor_agreement, 3),
    }

    overall = sum(components[k] * WEIGHTS[k] for k in WEIGHTS)

    if evidence_validation_status == "CONFLICT_DETECTED":
        overall *= 0.75
    elif evidence_validation_status == "INSUFFICIENT_EVIDENCE":
        overall *= 0.6

    return {
        "label": "PROTOTYPE CONFIDENCE ESTIMATION",
        "weights": WEIGHTS,
        "components": components,
        "overall_percent": round(overall * 100, 1),
        "cross_sensor_applicable": cross_modal is not None,
    }
