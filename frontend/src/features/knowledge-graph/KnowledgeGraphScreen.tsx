import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as d3 from 'd3-force';
import { select } from 'd3-selection';
import { zoom, zoomIdentity } from 'd3-zoom';
import { api } from '../../api/client';
import { useAsync } from '../../hooks/useAsync';
import { TopBar } from '../../layout/AppShell';
import { LoadingState, ErrorState } from '../../components/States';
import type { KGNode, KGEdge } from '../../api/types';

interface SimNode extends KGNode {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

const TYPE_STYLE: Record<string, { r: number; fill: string; stroke: string }> = {
  region: { r: 16, fill: '#22150a', stroke: '#ff8a34' },
  observation: { r: 11, fill: '#0d2030', stroke: '#5fb2e6' },
  result: { r: 15, fill: '#2b2109', stroke: '#f2c14e' },
  evidence: { r: 9, fill: '#062720', stroke: '#34d39a' },
  feature: { r: 7, fill: '#0d2030', stroke: '#8fd0f0' },
  external_signal: { r: 9, fill: '#2c0d16', stroke: '#ff4d6a' },
  association: { r: 9, fill: '#22150a', stroke: '#ffa75f' },
};

function nodeStyle(n: KGNode) {
  if (n.type === 'evidence' && n.detail?.validation_status === 'conflict') {
    return { r: 9, fill: '#331516', stroke: '#e8555a' };
  }
  return TYPE_STYLE[n.type] ?? { r: 8, fill: '#161f2e', stroke: '#647188' };
}

export function KnowledgeGraphScreen() {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const { data: graph, loading, error, reload } = useAsync(() => api.getKnowledgeGraph(missionId!), [missionId]);

  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [links, setLinks] = useState<(KGEdge & { source: SimNode; target: SimNode })[]>([]);
  const [selected, setSelected] = useState<KGNode | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    if (!graph) return;
    const simNodes: SimNode[] = graph.nodes.map((n) => ({ ...n, x: Math.random() * 600, y: Math.random() * 400 }));
    const byId = new Map(simNodes.map((n) => [n.id, n]));
    const simLinks = graph.edges
      .filter((e) => byId.has(e.source) && byId.has(e.target))
      .map((e) => ({ ...e, source: byId.get(e.source)!, target: byId.get(e.target)! }));

    const sim = d3
      .forceSimulation(simNodes as any)
      .force('link', d3.forceLink(simLinks as any).id((d: any) => d.id).distance(90).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-260))
      .force('center', d3.forceCenter(340, 230))
      .force('collide', d3.forceCollide().radius((d: any) => nodeStyle(d).r + 24))
      .stop();

    for (let i = 0; i < 220; i++) sim.tick();

    setNodes([...simNodes]);
    setLinks(simLinks as any);
  }, [graph]);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svgSel = select(svgRef.current);
    const gSel = select(gRef.current);
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 2.5])
      .on('zoom', (event) => {
        gSel.attr('transform', event.transform.toString());
      });
    svgSel.call(behavior as any);
    svgSel.call(behavior.transform as any, zoomIdentity);
    return () => {
      svgSel.on('.zoom', null);
    };
  }, [nodes.length]);

  const connectedIds = useMemo(() => {
    if (!selected) return null;
    const set = new Set<string>([selected.id]);
    links.forEach((l) => {
      if (l.source.id === selected.id) set.add(l.target.id);
      if (l.target.id === selected.id) set.add(l.source.id);
    });
    return set;
  }, [selected, links]);

  if (loading) return <LoadingState label="Building knowledge graph…" />;
  if (error || !graph) return <ErrorState message={error ?? 'Graph unavailable'} onRetry={reload} />;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar
        title="Interactive Knowledge Graph"
        subtitle="Generated from this mission's real observations, results and evidence — hover a node or edge, click to inspect."
        actions={<button onClick={() => navigate(`/workspace/${missionId}`)} className="text-xs text-accent">← Back to Workspace</button>}
      />
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_320px]">
        <div className="relative overflow-hidden bg-void bg-grid">
          <svg ref={svgRef} className="h-full w-full cursor-grab active:cursor-grabbing">
            <g ref={gRef}>
              {links.map((l, i) => {
                const dim = connectedIds && !(connectedIds.has(l.source.id) && connectedIds.has(l.target.id));
                const isAssoc = l.relationship.includes('association') || l.relationship.includes('correlated');
                return (
                  <line
                    key={i}
                    x1={l.source.x} y1={l.source.y} x2={l.target.x} y2={l.target.y}
                    stroke={isAssoc ? '#e8a33d' : '#334255'}
                    strokeWidth={1.4}
                    strokeDasharray={isAssoc ? '4 3' : undefined}
                    opacity={dim ? 0.12 : 0.7}
                  />
                );
              })}
              {nodes.map((n) => {
                const style = nodeStyle(n);
                const dim = connectedIds && !connectedIds.has(n.id);
                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x},${n.y})`}
                    opacity={dim ? 0.25 : 1}
                    className="cursor-pointer"
                    onMouseEnter={() => setHovered(n.id)}
                    onMouseLeave={() => setHovered((h) => (h === n.id ? null : h))}
                    onClick={() => setSelected(n)}
                  >
                    <circle r={style.r} fill={style.fill} stroke={selected?.id === n.id ? '#3fb6e8' : style.stroke} strokeWidth={selected?.id === n.id ? 2.5 : 1.5} />
                    <text y={style.r + 13} textAnchor="middle" fontSize={9.5} fill="#9aa7b8" className="select-none font-sans">
                      {n.label.length > 22 ? n.label.slice(0, 20) + '…' : n.label}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {hovered && (
            <div className="pointer-events-none absolute left-4 top-4 max-w-xs rounded-md border border-border bg-void/95 p-3 text-xs shadow-panel">
              {(() => {
                const n = nodes.find((x) => x.id === hovered);
                if (!n) return null;
                return (
                  <>
                    <div className="mb-1 font-semibold text-ink-primary">{n.label}</div>
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-ink-muted">{n.type.replace(/_/g, ' ')}</div>
                    {Object.entries(n.detail).slice(0, 4).map(([k, v]) => (
                      <div key={k} className="text-ink-secondary">{k}: {String(v).slice(0, 60)}</div>
                    ))}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        <div className="overflow-y-auto border-l border-border-subtle bg-surface p-4">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Node Detail</div>
          {!selected && <p className="text-xs text-ink-muted">Click a node to inspect its data source, model/tool, and evidence strength.</p>}
          {selected && (
            <div>
              <div className="text-[15px] font-bold text-ink-primary">{selected.label}</div>
              <div className="mt-0.5 text-xs uppercase tracking-wide text-accent">{selected.type.replace(/_/g, ' ')}</div>
              <div className="mt-3 space-y-2">
                {Object.entries(selected.detail).map(([k, v]) => (
                  <div key={k} className="border-t border-border-subtle pt-2 text-xs">
                    <div className="text-ink-muted">{k.replace(/_/g, ' ')}</div>
                    <div className="mt-0.5 break-words text-ink-primary">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setSelected(null)} className="mt-4 text-xs text-ink-muted hover:text-ink-primary">Clear selection</button>
            </div>
          )}

          <div className="mt-6 border-t border-border-subtle pt-4">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Legend</div>
            <div className="space-y-1.5 text-xs text-ink-secondary">
              {Object.entries(TYPE_STYLE).map(([type, s]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.fill, border: `1.5px solid ${s.stroke}` }} />
                  {type.replace(/_/g, ' ')}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
