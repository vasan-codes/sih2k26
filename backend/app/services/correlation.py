"""CorrelationService -- Innovation 2: Cross-Domain Phenomenon Correlation.

Computes a genuine linear trend (numpy polyfit) over the seeded external signal and
checks spatial proximity to the satellite-derived feature of interest. It explicitly
outputs an association-strength score, never a causal claim.
"""

from __future__ import annotations

import math

import numpy as np

from app.db.models import ExternalObservation

SPATIAL_PROXIMITY_PX = 60  # "near" if within this many demo-raster pixels


def correlate_external_signal(
    external_points: list[ExternalObservation],
    feature_px: tuple[float, float] | None,
) -> dict:
    if not external_points:
        return {
            "trend_slope_per_day": 0.0,
            "spatial_overlap": False,
            "support_level": "INSUFFICIENT_DATA",
            "strength": 0.0,
            "narrative": "No external observation data is available for this region.",
            "disclaimer": "Observed association does not independently establish causation.",
        }

    t0 = min(p.observed_at for p in external_points)
    days = np.array([(p.observed_at - t0).total_seconds() / 86400 for p in external_points])
    values = np.array([p.value for p in external_points])

    slope, _intercept = np.polyfit(days, values, 1) if len(days) >= 2 else (0.0, values[0])
    slope = float(slope)

    spatial_overlap = False
    if feature_px is not None:
        fx, fy = feature_px
        for p in external_points:
            geo = p.geometry or {}
            px, py = geo.get("cx"), geo.get("cy")
            if px is None or py is None:
                continue
            if math.dist((fx, fy), (px, py)) <= SPATIAL_PROXIMITY_PX:
                spatial_overlap = True
                break

    trend_strength = min(1.0, abs(slope) / 0.5)  # normalize: +0.5 units/day saturates strength
    strength = round((trend_strength * 0.6 + (0.4 if spatial_overlap else 0.0)), 3)

    if spatial_overlap and trend_strength > 0.3:
        support_level = "POSSIBLE_ASSOCIATION"
    elif spatial_overlap or trend_strength > 0.3:
        support_level = "WEAK_ASSOCIATION"
    else:
        support_level = "NO_ASSOCIATION_OBSERVED"

    direction = "rising" if slope > 0.02 else ("falling" if slope < -0.02 else "flat")
    narrative = (
        f"The external signal ({external_points[0].source}) shows a {direction} trend "
        f"({slope:+.2f} {external_points[0].unit}/day) over the observed window"
        + (", spatially coincident with the satellite-derived feature of interest." if spatial_overlap
           else ", with no confirmed spatial coincidence to the satellite-derived feature.")
    )

    return {
        "trend_slope_per_day": round(slope, 4),
        "spatial_overlap": spatial_overlap,
        "support_level": support_level,
        "strength": strength,
        "narrative": narrative,
        "disclaimer": "Observed association does not independently establish causation.",
    }
