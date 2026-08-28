import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api, assetUrl } from '../../api/client';
import { useAsync } from '../../hooks/useAsync';
import { TopBar } from '../../layout/AppShell';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { Panel, SectionLabel } from '../../components/Panel';
import { StatusBadge } from '../../components/StatusBadge';
import { pxToPercent } from '../../lib/geo';

export function Correlation() {
  const { regionKey } = useParams<{ regionKey?: string }>();
  const navigate = useNavigate();
  const regions = useAsync(() => api.listRegions(), []);
  const [resolvedKey, setResolvedKey] = useState<string | null>(regionKey ?? null);

  useEffect(() => {
    if (regionKey || !regions.data) return;
    // default to the first region that actually has external signal data
    api.externalObservations('aoi-coastal-wetland').then((pts) => {
      if (pts.length > 0) setResolvedKey('aoi-coastal-wetland');
    });
  }, [regionKey, regions.data]);

  const region = useAsync(() => (resolvedKey ? api.getRegion(resolvedKey) : Promise.resolve(null)), [resolvedKey]);
  const external = useAsync(() => (resolvedKey ? api.externalObservations(resolvedKey) : Promise.resolve([])), [resolvedKey]);
  const correlation = useAsync(() => (resolvedKey ? api.correlate(resolvedKey) : Promise.resolve(null)), [resolvedKey]);

  if (!resolvedKey) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title="Cross-Domain Phenomenon Correlation" subtitle="Innovation: relate satellite-observed change with independent environmental signals." />
        <div className="flex-1 p-8">
          {regions.loading && <LoadingState />}
          <EmptyState title="No region with external signal data selected" detail="Open Region Intelligence for the Coastal Wetland AOI and choose 'Explore Cross-Domain Correlation'." />
        </div>
      </div>
    );
  }

  if (region.loading || external.loading || correlation.loading) return <LoadingState label="Correlating signals…" />;
  if (region.error || !region.data) return <ErrorState message={region.error ?? 'Region unavailable'} onRetry={region.reload} />;

  const opticalObs = region.data.observations.find((o) => o.role === 'optical');
  const chartData = (external.data ?? []).map((p) => ({
    date: new Date(p.observed_at).toLocaleDateString(),
    value: p.value,
  }));

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar
        title="Cross-Domain Phenomenon Correlation"
        subtitle={region.data.label}
        actions={<button onClick={() => navigate(`/region-intelligence/${resolvedKey}`)} className="text-xs text-accent">← Back to Region</button>}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel eyebrow="Satellite Observation" title="Observation Timeline">
            <ul className="space-y-2 text-xs">
              {region.data.observations.map((o) => (
                <li key={o.id} className="rounded border border-border-subtle p-2">
                  <div className="font-semibold text-ink-primary">{o.name}</div>
                  <div className="font-mono text-ink-muted">{new Date(o.acquisition_time).toLocaleDateString()}</div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel eyebrow="Spatial Relationship" title="Feature location">
            {opticalObs && (
              <div className="relative aspect-square w-full overflow-hidden rounded-md border border-border-subtle bg-black">
                <img src={assetUrl(opticalObs.image_path)} className="absolute inset-0 h-full w-full object-cover" />
                {external.data?.map((p) => (
                  <span
                    key={p.id}
                    style={pxToPercent(p.geometry.cx, p.geometry.cy)}
                    className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-warn bg-warn/40"
                    title={`${p.value} ${p.unit}`}
                  />
                ))}
              </div>
            )}
            <p className="mt-2 text-[11px] text-ink-muted">Markers show where each external observation point was logged, over the optical scene.</p>
          </Panel>

          <Panel eyebrow="External Observation" title="Signal Timeline">
            <div className="mb-1 text-xs text-ink-secondary">{external.data?.[0]?.source}</div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#1c2635" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#647188' }} />
                <YAxis tick={{ fontSize: 9, fill: '#647188' }} />
                <Tooltip contentStyle={{ background: '#111927', border: '1px solid #263344', fontSize: 11 }} />
                <Line type="monotone" dataKey="value" stroke="#e8a33d" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        {correlation.data && (
          <Panel className="mt-4" eyebrow="Correlation / Association Explanation" title="Spatial-Temporal Association">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-start gap-2">
                <StatusBadge status={correlation.data.support_level} />
                <div className="font-mono text-2xl font-bold text-ink-primary">{Math.round(correlation.data.strength * 100)}%</div>
                <SectionLabel>Support strength</SectionLabel>
              </div>
              <div>
                <p className="text-sm text-ink-secondary">{correlation.data.narrative}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded border border-border-subtle p-2">
                    <div className="text-ink-muted">Trend slope</div>
                    <div className="font-mono text-ink-primary">{correlation.data.trend_slope_per_day.toFixed(3)} /day</div>
                  </div>
                  <div className="rounded border border-border-subtle p-2">
                    <div className="text-ink-muted">Spatial overlap</div>
                    <div className="font-mono text-ink-primary">{correlation.data.spatial_overlap ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-md border border-warn/30 bg-warn/10 p-3 text-xs text-warn">
              <strong>Scientific limitation:</strong> {correlation.data.disclaimer} This prototype supports OBSERVED
              CHANGE and POSSIBLE ASSOCIATION only — never PROVEN CAUSATION.
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
