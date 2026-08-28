import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { GeoPolygon } from '../../api/types';

export interface MapFeature {
  id: string;
  geometry: GeoPolygon;
  color: 'bad' | 'warn' | 'ok' | 'accent';
  label: string;
}

const COLOR_HEX: Record<MapFeature['color'], string> = {
  bad: '#ff4d6a',
  warn: '#f2c14e',
  ok: '#34d39a',
  accent: '#ff8a34',
};

const BASE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

export function SpatialMap({
  regionBbox,
  features,
  onFeatureClick,
}: {
  regionBbox: number[];
  features: MapFeature[];
  onFeatureClick?: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const [w, s, e, n] = regionBbox;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASE_STYLE,
      bounds: [
        [w, s],
        [e, n],
      ],
      fitBoundsOptions: { padding: 30 },
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      map.addSource('aoi', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] },
        },
      });
      map.addLayer({
        id: 'aoi-outline',
        type: 'line',
        source: 'aoi',
        paint: { 'line-color': '#3fb6e8', 'line-width': 1.5, 'line-dasharray': [2, 2] },
      });
    });

    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionBbox.join(',')]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    function render() {
      features.forEach((f) => {
        const sourceId = `feature-${f.id}`;
        const fillId = `${sourceId}-fill`;
        const lineId = `${sourceId}-line`;
        const geojson: GeoJSON.Feature = { type: 'Feature', properties: { id: f.id, label: f.label }, geometry: f.geometry as any };
        const existing = map!.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
        if (existing) {
          existing.setData(geojson);
        } else {
          map!.addSource(sourceId, { type: 'geojson', data: geojson });
          map!.addLayer({ id: fillId, type: 'fill', source: sourceId, paint: { 'fill-color': COLOR_HEX[f.color], 'fill-opacity': 0.28 } });
          map!.addLayer({ id: lineId, type: 'line', source: sourceId, paint: { 'line-color': COLOR_HEX[f.color], 'line-width': 2 } });
          map!.on('click', fillId, () => onFeatureClick?.(f.id));
          map!.on('mouseenter', fillId, () => { map!.getCanvas().style.cursor = 'pointer'; });
          map!.on('mouseleave', fillId, () => { map!.getCanvas().style.cursor = ''; });
        }
      });
    }

    if (map.isStyleLoaded()) render();
    else map.once('load', render);
  }, [features, onFeatureClick]);

  return <div ref={containerRef} className="h-full w-full rounded-md border border-border-subtle" />;
}
