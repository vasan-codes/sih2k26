"""ChangeAnalysisService -- real pixel-level bi-temporal change detection over the
synthetic demo rasters. Built-up classification, hotspot localization and area
quantification are all computed here, not asserted.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

from app.services.geo_utils import class_percentages, classify_landcover, find_hotspots

PIXEL_AREA_HA_PER_10M = 0.01  # 10m x 10m pixel = 100 sqm = 0.01 ha


def _load_rgb(path: Path) -> np.ndarray:
    return np.array(Image.open(path).convert("RGB"))


def run_change_analysis(t1_path: Path, t2_path: Path, size: int, bbox: list[float], resolution_m: float) -> dict:
    t1 = _load_rgb(t1_path)
    t2 = _load_rgb(t2_path)

    classes_t1 = classify_landcover(t1)
    classes_t2 = classify_landcover(t2)

    builtup_t1 = classes_t1["builtup"]
    builtup_t2 = classes_t2["builtup"]

    growth_mask = builtup_t2 & ~builtup_t1
    loss_mask = builtup_t1 & ~builtup_t2

    px_area_ha = (resolution_m / 10.0) ** 2 * PIXEL_AREA_HA_PER_10M
    total_pixels = builtup_t1.size

    hotspots = find_hotspots(growth_mask, size, bbox, block=32, top_n=3)
    for h in hotspots:
        h["area_hectares"] = round(h["pixel_count"] * px_area_ha, 2)
        del h["px_bbox"]

    percent_changed = round(100.0 * growth_mask.sum() / total_pixels, 3)

    return {
        "landcover_t1": class_percentages(classes_t1),
        "landcover_t2": class_percentages(classes_t2),
        "builtup_area_t1_ha": round(builtup_t1.sum() * px_area_ha, 2),
        "builtup_area_t2_ha": round(builtup_t2.sum() * px_area_ha, 2),
        "builtup_growth_ha": round(growth_mask.sum() * px_area_ha, 2),
        "builtup_loss_ha": round(loss_mask.sum() * px_area_ha, 2),
        "percent_area_changed": percent_changed,
        "growth_pixels": int(growth_mask.sum()),
        "loss_pixels": int(loss_mask.sum()),
        "total_pixels": int(total_pixels),
        "hotspots": hotspots,
        "has_significant_change": bool(growth_mask.sum() > total_pixels * 0.001),
    }
