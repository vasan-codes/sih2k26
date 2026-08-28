import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAsync } from '../../hooks/useAsync';
import { TopBar } from '../../layout/AppShell';
import { LoadingState, ErrorState } from '../../components/States';
import { SectionLabel } from '../../components/Panel';

export function RegionIntelligenceList() {
  const navigate = useNavigate();
  const { data: regions, loading, error, reload } = useAsync(() => api.listRegions(), []);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar
        title="Region Intelligence"
        subtitle="The geographic region — not the upload — is the unit of analysis. Select a region to see every compatible observation SatQuery AI can synchronize around it."
      />
      <div className="flex-1 overflow-y-auto p-8">
        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={reload} />}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {regions?.map((r) => {
            const sensors = Array.from(new Set(r.observations.map((o) => o.sensor_type)));
            return (
              <button
                key={r.key}
                onClick={() => navigate(`/region-intelligence/${r.key}`)}
                className="rounded-lg border border-border-subtle bg-surface p-5 text-left transition-all hover:border-accent/50 hover:shadow-glow"
              >
                <SectionLabel>{r.key}</SectionLabel>
                <h3 className="mt-1 text-[15px] font-bold text-ink-primary">{r.label}</h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-secondary">{r.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3">
                  <span className="text-xs text-ink-muted">{r.observations.length} observation(s) · {sensors.join(', ')}</span>
                  <span className="text-accent">→</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
