import type { GeoPolygon } from '../api/types';

/** Convert a GeoJSON polygon's bbox (or ring extent) into a CSS-percentage rect
 * relative to a region bbox [west, south, east, north] — used to overlay hotspot
 * boxes on top of the flat before/after raster comparison views. */
export function polygonToPercentRect(polygon: GeoPolygon, regionBbox: number[]) {
  const coords = polygon.bbox ?? computeBbox(polygon);
  const [w, s, e, n] = regionBbox;
  const [pw, ps, pe, pn] = coords;
  const left = ((pw - w) / (e - w)) * 100;
  const right = ((pe - w) / (e - w)) * 100;
  const top = ((n - pn) / (n - s)) * 100;
  const bottom = ((n - ps) / (n - s)) * 100;
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${Math.max(right - left, 0.5)}%`,
    height: `${Math.max(bottom - top, 0.5)}%`,
  };
}

function computeBbox(polygon: GeoPolygon): number[] {
  const ring = polygon.coordinates[0];
  const lons = ring.map((c) => c[0]);
  const lats = ring.map((c) => c[1]);
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
}

export function pxToPercent(px: number, py: number, size = 512) {
  return { left: `${(px / size) * 100}%`, top: `${(py / size) * 100}%` };
}

export function bboxToMapLibreCoords(bbox: number[]): [[number, number], [number, number], [number, number], [number, number]] {
  const [w, s, e, n] = bbox;
  return [
    [w, n],
    [e, n],
    [e, s],
    [w, s],
  ];
}
