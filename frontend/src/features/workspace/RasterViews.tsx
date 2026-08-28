import { useEffect, useRef, useState } from 'react';
import { polygonToPercentRect } from '../../lib/geo';
import type { GeoPolygon } from '../../api/types';

export interface Overlay {
  geometry: GeoPolygon;
  color: 'bad' | 'warn' | 'ok' | 'accent';
  label: string;
  onClick?: () => void;
}

const OVERLAY_COLOR: Record<Overlay['color'], string> = {
  bad: 'border-bad bg-bad/15',
  warn: 'border-warn bg-warn/15',
  ok: 'border-ok bg-ok/15',
  accent: 'border-accent bg-accent/15',
};

export function RasterFrame({
  imageUrl,
  regionBbox,
  overlays = [],
  label,
}: {
  imageUrl: string;
  regionBbox: number[];
  overlays?: Overlay[];
  label?: string;
}) {
  return (
    <div className="relative aspect-square w-full select-none overflow-hidden rounded-md border border-border-subtle bg-black">
      <img src={imageUrl} alt={label ?? 'observation'} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      {overlays.map((o, i) => (
        <button
          key={i}
          onClick={o.onClick}
          style={polygonToPercentRect(o.geometry, regionBbox)}
          className={`group absolute rounded-sm border-2 transition-all hover:brightness-125 ${OVERLAY_COLOR[o.color]}`}
          title={o.label}
        >
          <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-void/90 px-1.5 py-0.5 text-[10px] font-semibold text-ink-primary opacity-0 group-hover:opacity-100">
            {o.label}
          </span>
        </button>
      ))}
      {label && (
        <div className="absolute bottom-2 left-2 rounded bg-void/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-secondary">
          {label}
        </div>
      )}
    </div>
  );
}

export function SwipeCompare({
  beforeUrl,
  afterUrl,
  beforeLabel = 'Before',
  afterLabel = 'After',
}: {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const [pct, setPct] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function updateFromClientX(clientX: number) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPct(Math.min(100, Math.max(0, p)));
  }

  useEffect(() => {
    function move(e: MouseEvent) {
      if (dragging.current) updateFromClientX(e.clientX);
    }
    function up() {
      dragging.current = false;
    }
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="relative aspect-square w-full cursor-ew-resize select-none overflow-hidden rounded-md border border-border-subtle bg-black"
      onMouseDown={(e) => {
        dragging.current = true;
        updateFromClientX(e.clientX);
      }}
    >
      <img src={beforeUrl} alt={beforeLabel} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}>
        <img src={afterUrl} alt={afterLabel} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      </div>
      <div className="absolute bottom-0 top-0 w-0.5 bg-accent" style={{ left: `${pct}%` }}>
        <div className="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-[#04141c] shadow-glow">
          ⇔
        </div>
      </div>
      <div className="absolute bottom-2 left-2 rounded bg-void/80 px-2 py-0.5 text-[10px] font-semibold uppercase text-ink-secondary">{beforeLabel}</div>
      <div className="absolute bottom-2 right-2 rounded bg-void/80 px-2 py-0.5 text-[10px] font-semibold uppercase text-ink-secondary">{afterLabel}</div>
    </div>
  );
}

export function BlinkCompare({
  beforeUrl,
  afterUrl,
  beforeLabel = 'Before',
  afterLabel = 'After',
}: {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const [showAfter, setShowAfter] = useState(false);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setShowAfter((s) => !s), 800);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-md border border-border-subtle bg-black">
      <img src={beforeUrl} alt={beforeLabel} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <img
        src={afterUrl}
        alt={afterLabel}
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-200"
        style={{ opacity: showAfter ? 1 : 0 }}
        draggable={false}
      />
      <div className="absolute bottom-2 left-2 rounded bg-void/80 px-2 py-0.5 text-[10px] font-semibold uppercase text-ink-secondary">
        {showAfter ? afterLabel : beforeLabel}
      </div>
      <button
        onClick={() => setPlaying((p) => !p)}
        className="absolute bottom-2 right-2 rounded bg-void/80 px-2 py-1 text-[10px] font-semibold uppercase text-accent hover:text-accent-hover"
      >
        {playing ? 'Pause' : 'Play'}
      </button>
    </div>
  );
}
