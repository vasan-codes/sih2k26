"""VQAService, CaptioningService and GroundingService for the single-image mode.

No live vision-language model is integrated in this prototype. Instead these
services compute genuine per-pixel land-cover statistics from the demo raster and
answer/caption/ground from that real data via deterministic templates -- clearly
labeled DEMO/PROTOTYPE OUTPUT downstream. Swapping in a real RS-VLM later means
replacing the body of these three functions; callers and schemas stay the same.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

from app.services.geo_utils import class_percentages, classify_landcover, find_hotspots


def compute_landcover_stats(image_path: Path) -> dict:
    rgb = np.array(Image.open(image_path).convert("RGB"))
    classes = classify_landcover(rgb)
    return {"classes": classes, "percentages": class_percentages(classes)}


def generate_caption(percentages: dict[str, float]) -> str:
    ordered = sorted(percentages.items(), key=lambda kv: kv[1], reverse=True)
    dominant = ordered[0]
    parts = []
    label_map = {
        "vegetation": "vegetated cropland",
        "fallow_or_bare": "fallow or bare soil",
        "water": "open water",
        "builtup": "built-up / settlement area",
    }
    for key, pct in ordered:
        if pct < 0.5:
            continue
        parts.append(f"{pct:.1f}% {label_map.get(key, key)}")
    body = ", ".join(parts[:-1]) + (f", and {parts[-1]}" if len(parts) > 1 else parts[0] if parts else "no dominant classes")
    return (
        f"This is a mixed agricultural scene dominated by {label_map.get(dominant[0], dominant[0])} "
        f"({dominant[1]:.1f}% of frame). Composition: {body}."
    )


def answer_vqa(query_text: str, percentages: dict[str, float], stats: dict) -> dict:
    text = query_text.lower()
    referenced = []
    if "water" in text or "pond" in text:
        referenced.append("water")
        answer = (
            f"A water body is present, covering approximately {percentages['water']:.1f}% of the scene "
            f"(computed from blue-dominant reflectance pixels)."
        )
    elif any(t in text for t in ["vegetat", "crop", "field"]):
        referenced.append("vegetation")
        answer = (
            f"Vegetated / cropland areas cover approximately {percentages['vegetation']:.1f}% of the scene, "
            f"identified via green-dominant reflectance."
        )
    elif any(t in text for t in ["built", "settlement", "urban"]):
        referenced.append("builtup")
        answer = (
            f"A built-up cluster is visible, covering approximately {percentages['builtup']:.1f}% of the scene "
            f"(low-saturation, mid-to-high brightness pixels)."
        )
    elif "land cover" in text or "land-cover" in text or "major" in text:
        referenced = list(percentages.keys())
        top = sorted(percentages.items(), key=lambda kv: kv[1], reverse=True)
        answer = "Major land-cover types detected: " + "; ".join(f"{k} ({v:.1f}%)" for k, v in top if v > 0.5) + "."
    else:
        referenced = list(percentages.keys())
        answer = (
            "The scene is a mixed agricultural mosaic. Detected land-cover proportions: "
            + "; ".join(f"{k}: {v:.1f}%" for k, v in percentages.items())
            + ". Ask about a specific class (water, vegetation, built-up) for a more targeted answer."
        )
    return {"answer": answer, "referenced_classes": referenced}


def ground_query(query_text: str, classes: dict[str, np.ndarray], size: int, bbox: list[float]) -> dict | None:
    text = query_text.lower()
    target = None
    if "water" in text or "pond" in text:
        target = "water"
    elif any(t in text for t in ["vegetat", "crop", "field"]):
        target = "vegetation"
    elif any(t in text for t in ["built", "settlement", "urban"]):
        target = "builtup"
    if target is None:
        return None

    mask = classes[target]
    hotspots = find_hotspots(mask, size, bbox, block=16, top_n=2)
    for h in hotspots:
        del h["px_bbox"]
    return {"target_class": target, "regions": hotspots}
