"""EvidenceAggregationService, EvidenceValidationService and ConflictDetectionService.

Turns the raw specialist-service outputs into structured Evidence records, then
decides -- from those records, not from the model's say-so -- whether the mission's
answer is SUPPORTED, PARTIALLY_SUPPORTED, CONFLICT_DETECTED or INSUFFICIENT_EVIDENCE.
"""

from __future__ import annotations


def build_evidence_bi_temporal(change: dict, t1_id: str, t2_id: str) -> list[dict]:
    items = [
        {
            "type": "spatial",
            "source_service": "ChangeAnalysisService",
            "title": f"Built-up growth hotspot {i + 1}",
            "description": (
                f"{h['area_hectares']} ha of new built-up area localized to this region "
                f"({h['pixel_count']} px)."
            ),
            "geometry": h["geometry"],
            "metrics": {"area_hectares": h["area_hectares"], "pixel_count": h["pixel_count"]},
            "supporting_observation_ids": [t1_id, t2_id],
            "validation_status": "supported",
            "strength": min(1.0, 0.5 + h["area_hectares"] / 50),
        }
        for i, h in enumerate(change["hotspots"])
    ]
    if not change["hotspots"]:
        items.append({
            "type": "spatial",
            "source_service": "ChangeAnalysisService",
            "title": "No significant change hotspot",
            "description": "Built-up growth did not cluster into any region large enough to clear the hotspot threshold.",
            "geometry": None,
            "metrics": {"percent_area_changed": change["percent_area_changed"]},
            "supporting_observation_ids": [t1_id, t2_id],
            "validation_status": "insufficient",
            "strength": 0.2,
        })
    items += [
        {
            "type": "statistical",
            "source_service": "ChangeAnalysisService",
            "title": "Land-cover composition, T1 vs T2",
            "description": "Per-class land-cover percentage comparison between the two observation dates.",
            "geometry": None,
            "metrics": {"t1": change["landcover_t1"], "t2": change["landcover_t2"]},
            "supporting_observation_ids": [t1_id, t2_id],
            "validation_status": "supported",
            "strength": 0.7,
        },
    ]
    return items


def build_evidence_cross_modal(cross: dict, optical_id: str, sar_id: str) -> list[dict]:
    items = [
        {
            "type": "spatial",
            "source_service": "CrossModalAnalysisService",
            "title": "Optical-SAR confirmed water extent",
            "description": f"{cross['confirmed_water_area_ha']} ha confirmed as open water by BOTH optical and SAR.",
            "geometry": cross["agreement_geometry"][0]["geometry"] if cross["agreement_geometry"] else None,
            "metrics": {"confirmed_water_area_ha": cross["confirmed_water_area_ha"]},
            "supporting_observation_ids": [optical_id, sar_id],
            "validation_status": "supported",
            "strength": 0.9,
        }
    ]
    if cross["consistency_level"] != "HIGH_AGREEMENT":
        items.append(
            {
                "type": "cross_sensor",
                "source_service": "ConflictDetectionService",
                "title": "Cross-sensor disagreement region",
                "description": (
                    f"Optical imagery reads {cross['disputed_area_ha']} ha as water-like, but SAR backscatter "
                    f"does not support an open-water interpretation there (conflict ratio "
                    f"{cross['conflict_ratio'] * 100:.1f}%)."
                ),
                "geometry": cross["conflict_hotspots"][0]["geometry"] if cross["conflict_hotspots"] else None,
                "metrics": {"conflict_ratio": cross["conflict_ratio"], "disputed_area_ha": cross["disputed_area_ha"]},
                "supporting_observation_ids": [optical_id, sar_id],
                "validation_status": "conflict" if cross["consistency_level"] == "CONFLICT_DETECTED" else "partially_supported",
                "strength": 0.4,
            }
        )
    return items


def build_evidence_single_image(stats: dict, caption: str, obs_id: str, grounding: dict | None) -> list[dict]:
    items = [
        {
            "type": "statistical",
            "source_service": "VQAService/CaptioningService",
            "title": "Land-cover composition",
            "description": caption,
            "geometry": None,
            "metrics": stats["percentages"],
            "supporting_observation_ids": [obs_id],
            "validation_status": "supported",
            "strength": 0.75,
        }
    ]
    if grounding:
        items.append(
            {
                "type": "spatial",
                "source_service": "GroundingService",
                "title": f"Grounded region: {grounding['target_class']}",
                "description": f"Localized {len(grounding['regions'])} region(s) matching '{grounding['target_class']}'.",
                "geometry": grounding["regions"][0]["geometry"] if grounding["regions"] else None,
                "metrics": {"region_count": len(grounding["regions"])},
                "supporting_observation_ids": [obs_id],
                "validation_status": "supported" if grounding["regions"] else "insufficient",
                "strength": 0.8 if grounding["regions"] else 0.2,
            }
        )
    return items


def validate_evidence(evidence_items: list[dict]) -> dict:
    if not evidence_items:
        return {"status": "INSUFFICIENT_EVIDENCE", "notes": ["No evidence objects were produced by the workflow."]}

    statuses = [e["validation_status"] for e in evidence_items]
    notes = []

    if "conflict" in statuses:
        conflicting = [e["title"] for e in evidence_items if e["validation_status"] == "conflict"]
        notes.append(f"Cross-sensor conflict detected in: {', '.join(conflicting)}.")
        return {"status": "CONFLICT_DETECTED", "notes": notes}

    if "insufficient" in statuses:
        notes.append("One or more analysis steps produced insufficient evidence to support a strong conclusion.")
        return {"status": "INSUFFICIENT_EVIDENCE", "notes": notes}

    if "partially_supported" in statuses:
        notes.append("Some evidence partially supports the conclusion; see individual evidence items.")
        return {"status": "PARTIALLY_SUPPORTED", "notes": notes}

    notes.append(f"All {len(evidence_items)} evidence item(s) are internally consistent and spatially/temporally valid.")
    return {"status": "SUPPORTED", "notes": notes}
