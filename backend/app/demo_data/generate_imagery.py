"""
Generates synthetic "satellite-style" demo raster PNGs for the prototype scenarios.

These are NOT real satellite images. They are procedurally generated so that the
analysis services (change detection, cross-modal comparison, VQA/grounding) can run
genuine pixel-level computation (thresholding, diffing, area quantification) against
them instead of returning hardcoded numbers. Every array is built deterministically
from a fixed RandomState seed, so re-running generation produces byte-identical output.
"""

from pathlib import Path

import numpy as np
from PIL import Image

from app.demo_data.scenarios import BI_TEMPORAL, IMG_SIZE, OPTICAL_SAR, SINGLE_IMAGE

STATIC_DIR = Path(__file__).resolve().parents[1] / "static" / "imagery"

SOIL = np.array([133, 108, 79], dtype=np.float32)
VEG_LOW = np.array([96, 128, 61], dtype=np.float32)
VEG_HIGH = np.array([46, 122, 58], dtype=np.float32)
WATER_CORE = np.array([32, 86, 150], dtype=np.float32)
WATER_EDGE = np.array([92, 152, 205], dtype=np.float32)
BUILTUP = np.array([168, 165, 158], dtype=np.float32)
BUILTUP_DARK = np.array([120, 118, 113], dtype=np.float32)
ROAD = np.array([90, 88, 85], dtype=np.float32)
AMBIGUOUS_WET = np.array([176, 214, 222], dtype=np.float32)  # optically water-like sheen
FALLOW = np.array([176, 150, 84], dtype=np.float32)


def _smooth_field(seed: int, size: int = IMG_SIZE, passes: int = 7) -> np.ndarray:
    rng = np.random.RandomState(seed)
    field = rng.rand(size, size).astype(np.float32)
    for _ in range(passes):
        field = (
            np.roll(field, 1, 0) + np.roll(field, -1, 0) + np.roll(field, 1, 1) + np.roll(field, -1, 1) + 4 * field
        ) / 8.0
    field -= field.min()
    field /= max(field.max(), 1e-6)
    return field


def _terrain_rgb(field: np.ndarray) -> np.ndarray:
    t = field[..., None]
    low = SOIL * (1 - np.clip(t * 2, 0, 1)) + VEG_LOW * np.clip(t * 2, 0, 1)
    rgb = low * (1 - np.clip((t - 0.5) * 2, 0, 1)) + VEG_HIGH * np.clip((t - 0.5) * 2, 0, 1)
    return rgb


def _disk_mask(size: int, cx: int, cy: int, r: int) -> np.ndarray:
    yy, xx = np.mgrid[0:size, 0:size]
    return (xx - cx) ** 2 + (yy - cy) ** 2 <= r * r


def _blend(rgb: np.ndarray, mask: np.ndarray, color: np.ndarray, edge_color: np.ndarray | None = None, cx=0, cy=0, r=1):
    if edge_color is None:
        rgb[mask] = color
        return rgb
    yy, xx = np.mgrid[0 : rgb.shape[0], 0 : rgb.shape[1]]
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / max(r, 1)
    frac = np.clip(dist, 0, 1)[..., None]
    blended = color * (1 - frac) + edge_color * frac
    rgb[mask] = blended[mask]
    return rgb


def _blocky_builtup(size: int, cx: int, cy: int, r: int, seed: int) -> np.ndarray:
    mask = _disk_mask(size, cx, cy, r)
    rng = np.random.RandomState(seed)
    block = 10
    grid = rng.rand(size // block + 2, size // block + 2) > 0.35
    grid_up = np.kron(grid, np.ones((block, block), dtype=bool))[:size, :size]
    return mask & grid_up


def _add_speckle(gray: np.ndarray, seed: int, strength: float = 0.12) -> np.ndarray:
    rng = np.random.RandomState(seed)
    noise = 1 + rng.normal(0, strength, size=gray.shape)
    return np.clip(gray * noise, 0, 255)


def _river_mask(size: int, x0: int, x1: int, wobble: float) -> np.ndarray:
    yy, xx = np.mgrid[0:size, 0:size]
    center = (x0 + x1) / 2 + wobble * np.sin(yy / size * 3.2 * np.pi)
    half_width = (x1 - x0) / 2
    return np.abs(xx - center) <= half_width


def _save(rgb_or_gray: np.ndarray, path: Path) -> None:
    arr = np.clip(rgb_or_gray, 0, 255).astype(np.uint8)
    mode = "L" if arr.ndim == 2 else "RGB"
    Image.fromarray(arr, mode=mode).save(path)


def generate_bi_temporal() -> None:
    layout = BI_TEMPORAL["layout"]
    size = IMG_SIZE

    field = _smooth_field(layout["vegetation_seed"], size)
    base = _terrain_rgb(field)

    river = _river_mask(size, layout["river"]["x0"], layout["river"]["x1"], layout["river"]["wobble"])

    def render(settlement_circles, road=None, seed_extra=0):
        rgb = base.copy()
        rgb = _blend(rgb, river, WATER_CORE, WATER_EDGE, cx=35, cy=size // 2, r=size // 2)
        for i, c in enumerate(settlement_circles):
            mask = _blocky_builtup(size, c["cx"], c["cy"], c["r"], seed=100 + i + seed_extra)
            rgb[mask] = BUILTUP
            ring = _disk_mask(size, c["cx"], c["cy"], c["r"] + 4) & ~_disk_mask(size, c["cx"], c["cy"], c["r"])
            rgb[ring] = BUILTUP_DARK
        if road:
            y0 = road["y"] - road["thickness"] // 2
            y1 = road["y"] + road["thickness"] // 2
            rgb[y0:y1, :] = ROAD
        return rgb

    t1_rgb = render(layout["settlement_t1"])
    t2_rgb = render(layout["settlement_t1"] + layout["settlement_growth_t2"], road=layout["road_t2"], seed_extra=50)

    _save(t1_rgb, STATIC_DIR / BI_TEMPORAL["t1"]["image_file"])
    _save(t2_rgb, STATIC_DIR / BI_TEMPORAL["t2"]["image_file"])


def generate_optical_sar() -> None:
    layout = OPTICAL_SAR["layout"]
    size = IMG_SIZE

    field = _smooth_field(layout["vegetation_seed"], size)
    base = _terrain_rgb(field)

    water = layout["true_water"]
    ambiguous = layout["ambiguous_patch"]

    water_mask = _disk_mask(size, water["cx"], water["cy"], water["r"])
    ambiguous_mask = _disk_mask(size, ambiguous["cx"], ambiguous["cy"], ambiguous["r"])

    optical = base.copy()
    optical = _blend(optical, water_mask, WATER_CORE, WATER_EDGE, cx=water["cx"], cy=water["cy"], r=water["r"])
    optical[ambiguous_mask] = AMBIGUOUS_WET

    # SAR: backscatter-intensity grayscale. water = very low, vegetation = medium (+speckle),
    # the ambiguous patch reads as vegetation/moist-soil intensity, NOT low like open water.
    veg_intensity = 70 + field * 70  # 70-140
    sar = veg_intensity.copy()
    sar[water_mask] = 18  # strong specular/low backscatter for open water
    sar[ambiguous_mask] = 118  # vegetation-like backscatter -- disagrees with optical's "water-like" read
    sar = _add_speckle(sar, seed=77)

    _save(optical, STATIC_DIR / OPTICAL_SAR["optical"]["image_file"])
    _save(sar, STATIC_DIR / OPTICAL_SAR["sar"]["image_file"])


def generate_single_image() -> None:
    layout = SINGLE_IMAGE["layout"]
    size = IMG_SIZE

    field = _smooth_field(layout["field_seed"], size)
    rng = np.random.RandomState(layout["field_seed"] + 1)

    # agricultural mosaic: grid of parcels, each colored by local field value
    parcel = 64
    rgb = np.zeros((size, size, 3), dtype=np.float32)
    for gy in range(0, size, parcel):
        for gx in range(0, size, parcel):
            v = field[gy : gy + parcel, gx : gx + parcel].mean()
            jitter = rng.uniform(-0.05, 0.05)
            v = np.clip(v + jitter, 0, 1)
            if v > 0.55:
                color = VEG_HIGH
            elif v > 0.35:
                color = VEG_LOW
            else:
                color = FALLOW
            rgb[gy : gy + parcel, gx : gx + parcel] = color
    # parcel boundaries
    rgb[::parcel, :] *= 0.85
    rgb[:, ::parcel] *= 0.85

    pond = layout["pond"]
    pond_mask = _disk_mask(size, pond["cx"], pond["cy"], pond["r"])
    rgb = _blend(rgb, pond_mask, WATER_CORE, WATER_EDGE, cx=pond["cx"], cy=pond["cy"], r=pond["r"])

    settlement = layout["settlement"]
    settle_mask = _blocky_builtup(size, settlement["cx"], settlement["cy"], settlement["r"], seed=5)
    rgb[settle_mask] = BUILTUP

    y0 = layout["road_y"] - 3
    y1 = layout["road_y"] + 3
    rgb[y0:y1, :] = ROAD

    _save(rgb, STATIC_DIR / SINGLE_IMAGE["observation"]["image_file"])


def generate_all(force: bool = False) -> list[str]:
    STATIC_DIR.mkdir(parents=True, exist_ok=True)
    generated = []
    checks = [
        (BI_TEMPORAL["t1"]["image_file"], generate_bi_temporal),
        (OPTICAL_SAR["optical"]["image_file"], generate_optical_sar),
        (SINGLE_IMAGE["observation"]["image_file"], generate_single_image),
    ]
    seen_funcs = set()
    for fname, fn in checks:
        target = STATIC_DIR / fname
        if force or not target.exists():
            if fn not in seen_funcs:
                fn()
                seen_funcs.add(fn)
            generated.append(fname)
    return generated


if __name__ == "__main__":
    files = generate_all(force=True)
    print(f"Generated {len(files)} demo imagery files in {STATIC_DIR}")
