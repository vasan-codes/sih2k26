"""CrossModalAnalysisService -- independently interprets optical and SAR observations
of the same footprint, then explicitly checks whether they agree (Innovation 3:
Cross-Sensor Consistency & Conflict Detection).
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

from app.services.geo_utils import find_hotspots

OPTICAL_WATER_BRIGHTNESS_MIN = 120
SAR_WATER_INTENSITY_MAX = 60

HIGH_AGREEMENT_MAX_CONFLICT_RATIO = 0.05
PARTIAL_AGREEMENT_MAX_CONFLICT_RATIO = 0.12


def run_cross_modal_analysis(optical_path: Path, sar_path: Path, size: int, bbox: list[float], resolution_m: float) -> dict:
    optical = np.array(Image.open(optical_path).convert("RGB")).astype(float)
    sar = np.array(Image.open(sar_path).convert("L")).astype(float)

    r, g, b = optical[..., 0], optical[..., 1], optical[..., 2]
    optical_water_mask = (b > r) & (b > g) & (b > OPTICAL_WATER_BRIGHTNESS_MIN)
    sar_water_mask = sar < SAR_WATER_INTENSITY_MAX

    agreement_mask = optical_water_mask & sar_water_mask
    conflict_mask = optical_water_mask & ~sar_water_mask  # optical reads water-like, SAR disagrees
    sar_only_mask = sar_water_mask & ~optical_water_mask

    optical_water_total = int(optical_water_mask.sum())
    conflict_pixels = int(conflict_mask.sum())
    conflict_ratio = round(conflict_pixels / optical_water_total, 4) if optical_water_total else 0.0

    if conflict_ratio <= HIGH_AGREEMENT_MAX_CONFLICT_RATIO:
        consistency_level = "HIGH_AGREEMENT"
    elif conflict_ratio <= PARTIAL_AGREEMENT_MAX_CONFLICT_RATIO:
        consistency_level = "PARTIAL_AGREEMENT"
    else:
        consistency_level = "CONFLICT_DETECTED"

    px_area_ha = (resolution_m / 10.0) ** 2 * 0.01

    conflict_hotspots = []
    if conflict_pixels > 0:
        conflict_hotspots = find_hotspots(conflict_mask, size, bbox, block=32, top_n=2)
        for h in conflict_hotspots:
            h["area_hectares"] = round(h["pixel_count"] * px_area_ha, 2)
            del h["px_bbox"]

    return {
        "optical_interpretation": (
            f"Optical imagery shows {optical_water_total} px "
            f"({round(100 * optical_water_total / optical_water_mask.size, 2)}% of scene) with a "
            f"blue-dominant, water-like reflectance signature."
        ),
        "sar_interpretation": (
            f"SAR (VV) backscatter shows {int(sar_water_mask.sum())} px with low-intensity, "
            f"open-water-consistent backscatter."
        ),
        "consistency_level": consistency_level,
        "conflict_ratio": conflict_ratio,
        "agreement_pixels": int(agreement_mask.sum()),
        "conflict_pixels": conflict_pixels,
        "sar_only_pixels": int(sar_only_mask.sum()),
        "confirmed_water_area_ha": round(int(agreement_mask.sum()) * px_area_ha, 2),
        "disputed_area_ha": round(conflict_pixels * px_area_ha, 2),
        "conflict_hotspots": conflict_hotspots,
        "agreement_geometry": find_hotspots(agreement_mask, size, bbox, block=32, top_n=1),
    }
