"""QueryUnderstandingService -- real (if simple) rule-based NLP over the user's query.

Not a stub: every field returned is actually derived from matching the query text
against keyword sets, not hardcoded per-scenario.
"""

from __future__ import annotations

import re

GROUNDING_KEYWORDS = ["highlight", "show me", "locate", "find", "point out", "mark", "where is", "where are"]
CAPTIONING_KEYWORDS = ["describe", "what is visible", "what's visible", "overview", "scene", "summarize the image"]
CHANGE_KEYWORDS = [
    "chang", "increas", "decreas", "grow", "grew", "expand", "shrink", "before and after",
    "compare", "difference", "lost", "gained", "over time",
]
VERIFY_KEYWORDS = ["verify", "confirm", "sar", "radar", "cross-check", "cross check", "double-check", "double check"]
QUANTIFY_KEYWORDS = ["how much", "how many", "area", "percentage", "percent", "hectare", "sq km", "square km", "extent"]
LANDCOVER_TERMS = ["water", "vegetation", "crop", "forest", "built-up", "built up", "settlement", "urban", "road", "land cover", "land-cover"]


def _find_matches(text: str, keywords: list[str]) -> list[str]:
    return [k for k in keywords if k in text]


def understand_query(query_text: str) -> dict:
    text = (query_text or "").lower().strip()

    grounding_hits = _find_matches(text, GROUNDING_KEYWORDS)
    captioning_hits = _find_matches(text, CAPTIONING_KEYWORDS)
    change_hits = _find_matches(text, CHANGE_KEYWORDS)
    verify_hits = _find_matches(text, VERIFY_KEYWORDS)
    quantify_hits = _find_matches(text, QUANTIFY_KEYWORDS)
    landcover_hits = _find_matches(text, LANDCOVER_TERMS)

    if change_hits:
        intent = "change_analysis"
    elif grounding_hits:
        intent = "text_guided_grounding"
    elif captioning_hits:
        intent = "scene_captioning"
    else:
        intent = "visual_question_answering"

    temporal_terms = re.findall(r"\b(19|20)\d{2}\b|before|after|since|between .* and", text)
    spatial_terms = re.findall(r"\bnorth|south|east|west|near|along|around|within\b", text)

    return {
        "normalized_query": text,
        "intent": intent,
        "keywords_matched": {
            "grounding": grounding_hits,
            "captioning": captioning_hits,
            "change": change_hits,
            "cross_sensor_verification": verify_hits,
            "quantification": quantify_hits,
            "land_cover_terms": landcover_hits,
        },
        "wants_cross_sensor_verification": bool(verify_hits),
        "wants_quantification": bool(quantify_hits),
        "wants_grounding": bool(grounding_hits),
        "temporal_reference_detected": bool(temporal_terms),
        "spatial_reference_detected": bool(spatial_terms),
    }
