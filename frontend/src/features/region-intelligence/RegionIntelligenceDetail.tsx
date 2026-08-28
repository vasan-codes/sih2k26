import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAsync } from '../../hooks/useAsync';
import { TopBar } from '../../layout/AppShell';
import { LoadingState, ErrorState } from '../../components/States';
import { Panel, SectionLabel } from '../../components/Panel';
import { Button } from '../../components/Button';
import { CheckRow } from '../../components/StatusBadge';

const SUGGESTED_QUERY: Record<string, string> = {
  'aoi-riverside-corridor': 'Has the built-up area increased between these dates, and where?',
  'aoi-coastal-wetland': 'Verify the water extent in this wetland using SAR and flag any disagreement.',
  'aoi-agro-mosaic': 'Describe the agricultural activity in this image and highlight the water body.',
};

export function RegionIntelligenceDetail() {
  const { regionKey } = useParams<{ regionKey: string }>();
  const navigate = useNavigate();
  const { data: region, loading, error, reload } = useAsync(() => api.getRegion(regionKey!), [regionKey]);
  const externalObs = useAsync(() => api.externalObservations(regionKey!), [regionKey]);
  const [running, setRunning] = useState(false);

  async function analyzeAll() {
    if (!region) return;
    setRunning(true);
    try {
      const mission = await api.analyze(region.modes[0], region.key, SUGGESTED_QUERY[region.key] ?? 'Provide a regional intelligence summary of this area.');
      navigate(`/workspace/${mission.id}`);
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error || !region) return <ErrorState message={error ?? 'Region not found'} onRetry={reload} />;

  const sorted = [...region.observations].sort((a, b) => a.acquisition_time.localeCompare(b.acquisition_time));
  const bySensor: Record<string, typeof sorted> = {};
  sorted.forEach((o) => (bySensor[o.sensor_type] ??= []).push(o));

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar
        title={region.label}
        subtitle={region.description}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/new-analysis', { state: { mode: region.modes[0], regionKey: region.key } })}>
              Custom Observation Selection
            </Button>
            <Button variant="primary" loading={running} onClick={analyzeAll}>Analyze All Compatible Observations</Button>
          </>
        }
      />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            <Panel eyebrow="Available Observations" title="Timeline">
              <div className="space-y-4">
                {Object.entries(bySensor).map(([sensor, obs]) => (
                  <div key={sensor}>
                    <SectionLabel className="mb-2">{sensor} ({obs.length})</SectionLabel>
                    <div className="space-y-2">
                      {obs.map((o) => (
                        <div key={o.id} className="flex items-center justify-between rounded-md border border-border-subtle p-2.5">
                          <div>
                            <div className="text-[13px] font-semibold text-ink-primary">{o.name}</div>
                            <div className="font-mono text-[11px] text-ink-muted">
                              {new Date(o.acquisition_time).toLocaleDateString()} · {o.resolution_m}m · {o.crs} · role: {o.role}
                            </div>
                          </div>
                          <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] uppercase text-ink-muted">{o.modality}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            {externalObs.data && externalObs.data.length > 0 && (
              <Panel eyebrow="Innovation: Cross-Domain Correlation" title="External environmental signal available">
                <p className="text-sm text-ink-secondary">
                  {externalObs.data.length} independent environmental observation point(s) are available for this
                  region, from {externalObs.data[0].source}.
                </p>
                <Button variant="secondary" className="mt-3" onClick={() => navigate(`/correlation/${region.key}`)}>
                  Explore Cross-Domain Correlation →
                </Button>
              </Panel>
            )}
          </div>

          <div className="space-y-5">
            <Panel title="Compatibility">
              <CheckRow label="Common footprint" status={true} detail="All observations share the region's AOI footprint." />
              <CheckRow label="Supported modes" status={true} detail={region.modes.join(', ')} />
            </Panel>
            <Panel title="Region metadata">
              <div className="space-y-1.5 font-mono text-xs text-ink-secondary">
                <div>Key: {region.key}</div>
                <div>BBox: [{region.bbox.map((v) => v.toFixed(3)).join(', ')}]</div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
