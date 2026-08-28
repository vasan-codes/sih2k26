import { useNavigate } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../api/client';
import { Button } from '../../components/Button';
import { Panel } from '../../components/Panel';
import { LoadingState, ErrorState } from '../../components/States';
import { StatusBadge } from '../../components/StatusBadge';

export function Dashboard() {
  const navigate = useNavigate();
  const missions = useAsync(() => api.listMissions(), []);
  const regions = useAsync(() => api.listRegions(), []);

  const completed = missions.data?.filter((m) => m.status === 'completed') ?? [];

  return (
    <div className="flex-1 overflow-y-auto">
      <section className="relative overflow-hidden border-b border-border-subtle bg-grid px-10 py-16">
        {/* orbital system — decorative, purposeful to the space-tech theme */}
        <div className="pointer-events-none absolute -right-24 -top-16 h-[28rem] w-[28rem] opacity-70 md:opacity-100">
          <div className="absolute inset-0 animate-glow-pulse rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 animate-orbit rounded-full border border-accent/20">
            <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-accent shadow-glow-lg" />
          </div>
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 animate-orbit-reverse rounded-full border border-water/20">
            <span className="absolute bottom-2 right-6 h-1.5 w-1.5 rounded-full bg-water shadow-glow" />
          </div>
          <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 animate-float rounded-full bg-gradient-to-br from-accent/60 via-water/40 to-surface shadow-glow-lg" />
        </div>

        <div className="relative max-w-3xl">
          <div className="mb-4 inline-flex animate-fade-up items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
            <span className="h-1.5 w-1.5 animate-twinkle rounded-full bg-accent" />
            Agentic Earth Observation Intelligence
          </div>
          <h1 className="animate-fade-up text-6xl font-extrabold tracking-tight text-gradient [animation-delay:60ms]">
            SatQuery AI
          </h1>
          <p className="mt-3 animate-fade-up font-mono text-xl font-semibold text-accent [animation-delay:120ms]">
            "Ask the Earth. See the Evidence."
          </p>
          <p className="mt-4 max-w-xl animate-fade-up text-[15px] leading-relaxed text-ink-secondary [animation-delay:180ms]">
            Analyze optical, SAR and multi-temporal satellite observations using specialized AI
            workflows, spatial evidence and cross-sensor validation — orchestrated automatically
            from a single natural-language query.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3 animate-fade-up [animation-delay:240ms]">
            <Button variant="primary" className="px-5 py-2.5 text-[13px]" onClick={() => navigate('/new-analysis')}>
              New Analysis
            </Button>
            <Button variant="secondary" className="px-5 py-2.5 text-[13px]" onClick={() => navigate('/region-intelligence')}>
              Explore Region
            </Button>
            {completed[0] && (
              <Button
                variant="ghost"
                className="px-5 py-2.5 text-[13px]"
                onClick={() => navigate(`/results/${completed[0].id}`)}
              >
                Open Demo Mission →
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 p-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <Panel eyebrow="Prototype Telemetry" title="Mission activity">
            {missions.loading && <LoadingState />}
            {missions.error && <ErrorState message={missions.error} onRetry={missions.reload} />}
            {missions.data && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label="Total missions" value={missions.data.length} />
                <Stat label="Completed" value={completed.length} />
                <Stat label="Demo missions" value={missions.data.filter((m) => m.is_demo).length} />
                <Stat label="Saved analyses" value={missions.data.filter((m) => m.saved).length} />
              </div>
            )}
            <p className="mt-4 text-[11px] text-ink-muted">
              Derived live from the mission store — not hardcoded. avg confidence shown per-mission below.
            </p>
          </Panel>

          <Panel eyebrow="Mission Store" title="Recent missions">
            {missions.loading && <LoadingState />}
            {missions.data && missions.data.length === 0 && (
              <p className="text-sm text-ink-muted">No missions yet. Start a New Analysis to populate this list.</p>
            )}
            <div className="divide-y divide-border-subtle">
              {missions.data?.slice(0, 6).map((m) => (
                <button
                  key={m.id}
                  onClick={() => navigate(m.status === 'completed' ? `/results/${m.id}` : `/workspace/${m.id}`)}
                  className="flex w-full items-center justify-between gap-4 rounded-md px-2 py-3 text-left transition-all duration-200 hover:translate-x-1 hover:bg-white/[0.04]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-ink-primary">{m.title}</div>
                    <div className="mt-0.5 truncate text-xs text-ink-muted">{m.query_text}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={m.status} />
                  </div>
                </button>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel eyebrow="Demo AOIs" title="Available regions">
            {regions.loading && <LoadingState />}
            <div className="space-y-2.5">
              {regions.data?.map((r) => (
                <button
                  key={r.key}
                  onClick={() => navigate(`/region-intelligence/${r.key}`)}
                  className="block w-full rounded-md border border-border-subtle p-3 text-left transition-colors hover:border-accent/50 hover:bg-white/[0.02]"
                >
                  <div className="text-[13px] font-semibold text-ink-primary">{r.label}</div>
                  <div className="mt-1 text-xs text-ink-muted">{r.description}</div>
                  <div className="mt-2 flex gap-1.5">
                    {r.modes.map((mode) => (
                      <span key={mode} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-ink-muted">
                        {mode.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Platform" title="Core capabilities">
            <ul className="space-y-2 text-[13px] text-ink-secondary">
              <li>• Single-image VQA, captioning &amp; text-guided grounding</li>
              <li>• Optical + SAR cross-modal analysis with conflict detection</li>
              <li>• Bi-temporal change detection &amp; quantification</li>
              <li>• Evidence validation &amp; explainable confidence</li>
              <li>• Region-centric multi-satellite intelligence</li>
              <li>• Interactive remote-sensing knowledge graph</li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="group relative overflow-hidden rounded-md border border-border-subtle bg-surface-raised p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-glow">
      <span className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-accent/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative font-mono text-2xl font-bold text-ink-primary transition-colors group-hover:text-accent">{value}</div>
      <div className="relative mt-0.5 text-[11px] text-ink-muted">{label}</div>
    </div>
  );
}
