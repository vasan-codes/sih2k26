"""Shared geospatial + raster helper functions used by the specialist analysis services."""

from __future__ import annotations

import numpy as np


def bbox_polygon(bbox: list[float]) -> dict:
    """bbox = [west, south, east, north] -> GeoJSON Polygon (with a `bbox` member,
    a standard optional GeoJSON field, kept for cheap downstream overlap checks)."""
    w, s, e, n = bbox
    return {
        "type": "Polygon",
        "coordinates": [[[w, s], [e, s], [e, n], [w, n], [w, s]]],
        "bbox": bbox,
    }


def px_to_lonlat(px: float, py: float, size: int, bbox: list[float]) -> tuple[float, float]:
    w, s, e, n = bbox
    lon = w + (px / size) * (e - w)
    lat = n - (py / size) * (n - s)  # row 0 = north edge
    return lon, lat


def px_bbox_to_geo_polygon(x0: int, y0: int, x1: int, y1: int, size: int, bbox: list[float]) -> dict:
    lon0, lat0 = px_to_lonlat(x0, y1, size, bbox)  # bottom-left (y1 = lower on screen = south)
    lon1, lat1 = px_to_lonlat(x1, y0, size, bbox)  # top-right
    return {
        "type": "Polygon",
        "coordinates": [[[lon0, lat0], [lon1, lat0], [lon1, lat1], [lon0, lat1], [lon0, lat0]]],
    }


def bbox_overlap_ratio(a: list[float], b: list[float]) -> float:
    """IoU of two [west, south, east, north] boxes."""
    aw, as_, ae, an = a
    bw, bs, be, bn = b
    iw = max(0.0, min(ae, be) - max(aw, bw))
    ih = max(0.0, min(an, bn) - max(as_, bs))
    inter = iw * ih
    area_a = max(0.0, ae - aw) * max(0.0, an - as_)
    area_b = max(0.0, be - bw) * max(0.0, bn - bs)
    union = area_a + area_b - inter
    return inter / union if union > 0 else 0.0


def find_hotspots(mask: np.ndarray, size: int, bbox: list[float], block: int = 32, top_n: int = 3) -> list[dict]:
    """Coarse grid-based clustering of a boolean change/detection mask into up to
    top_n spatial hotspot regions, each with a real pixel-count-derived bbox. Avoids
    a scipy dependency while still doing genuine connected-region grouping."""
    n_blocks = size // block
    block_counts = np.zeros((n_blocks, n_blocks), dtype=np.int64)
    for by in range(n_blocks):
        for bx in range(n_blocks):
            block_counts[by, bx] = mask[by * block : (by + 1) * block, bx * block : (bx + 1) * block].sum()

    active = block_counts > (block * block * 0.03)  # at least 3% of block must be "on"
    visited = np.zeros_like(active, dtype=bool)
    clusters = []

    for by in range(n_blocks):
        for bx in range(n_blocks):
            if not active[by, bx] or visited[by, bx]:
                continue
            # BFS over the small block grid (4-connectivity)
            stack = [(by, bx)]
            visited[by, bx] = True
            cells = []
            while stack:
                cy, cx = stack.pop()
                cells.append((cy, cx))
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < n_blocks and 0 <= nx < n_blocks and active[ny, nx] and not visited[ny, nx]:
                        visited[ny, nx] = True
                        stack.append((ny, nx))
            pixel_count = int(sum(block_counts[y, x] for y, x in cells))
            ys = [y for y, _ in cells]
            xs = [x for _, x in cells]
            x0, x1 = min(xs) * block, (max(xs) + 1) * block
            y0, y1 = min(ys) * block, (max(ys) + 1) * block
            clusters.append(
                {
                    "pixel_count": pixel_count,
                    "px_bbox": (x0, y0, min(x1, size), min(y1, size)),
                }
            )

    clusters.sort(key=lambda c: c["pixel_count"], reverse=True)
    top = clusters[:top_n]
    out = []
    for c in top:
        x0, y0, x1, y1 = c["px_bbox"]
        out.append(
            {
                "pixel_count": c["pixel_count"],
                "geometry": px_bbox_to_geo_polygon(x0, y0, x1, y1, size, bbox),
                "px_bbox": [x0, y0, x1, y1],
            }
        )
    return out


def classify_landcover(rgb: np.ndarray) -> dict[str, np.ndarray]:
    """Rule-based per-pixel land-cover classification from an RGB array.
    Deterministic thresholds over color channels -- a stand-in for a real
    land-cover classifier, applied identically everywhere it's used."""
    r, g, b = rgb[..., 0].astype(float), rgb[..., 1].astype(float), rgb[..., 2].astype(float)
    brightness = (r + g + b) / 3
    sat = rgb.astype(float).max(axis=-1) - rgb.astype(float).min(axis=-1)

    water = (b > r) & (b > g) & (b > 110)
    builtup = (~water) & (sat < 30) & (brightness > 95) & (brightness < 235)
    vegetation = (~water) & (~builtup) & (g > r) & (g > b - 10)
    fallow = (~water) & (~builtup) & (~vegetation)

    return {"water": water, "builtup": builtup, "vegetation": vegetation, "fallow_or_bare": fallow}


def class_percentages(classes: dict[str, np.ndarray]) -> dict[str, float]:
    total = next(iter(classes.values())).size
    return {k: round(100.0 * v.sum() / total, 2) for k, v in classes.items()}
