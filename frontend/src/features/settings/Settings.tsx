import { useAsync } from '../../hooks/useAsync';
import { api } from '../../api/client';
import { TopBar } from '../../layout/AppShell';
import { Panel } from '../../components/Panel';

export function Settings() {
  const health = useAsync(() => api.health(), []);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar title="Settings" subtitle="Prototype configuration and platform information." />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-3xl space-y-5">
          <Panel eyebrow="Environment" title="Backend connection">
            <div className="space-y-1.5 font-mono text-xs">
              <div>Status: <span className="text-ok">{health.data?.status ?? 'checking…'}</span></div>
              <div>Mode: <span className="text-warn">{health.data?.mode ?? '—'}</span></div>
              <div>API base: {import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'}</div>
            </div>
          </Panel>

          <Panel eyebrow="Data layer" title="Persistence architecture">
            <p className="text-sm text-ink-secondary">
              This prototype persists missions, observations, evidence, execution logs and the model
              registry in SQLite via SQLAlchemy, modeled directly on the production PostgreSQL+PostGIS
              schema described in the platform spec. Swapping the engine string is the only change
              required to move to Postgres+PostGIS in production.
            </p>
          </Panel>

          <Panel eyebrow="Display" title="Units &amp; presentation">
            <div className="space-y-2 text-sm text-ink-secondary">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <span>Area units</span><span className="font-mono text-ink-primary">Hectares (ha)</span>
              </div>
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <span>Coordinate reference</span><span className="font-mono text-ink-primary">EPSG:4326</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Theme</span><span className="font-mono text-ink-primary">Dark (mission console)</span>
              </div>
            </div>
          </Panel>

          <Panel eyebrow="Disclosure" title="Prototype scope">
            <ul className="space-y-1.5 text-sm text-ink-secondary">
              <li>• All imagery is synthetically generated demo data, not real satellite acquisitions.</li>
              <li>• Specialist analysis services are deterministic prototype implementations, not trained models.</li>
              <li>• Confidence scores are a disclosed, weighted composition — not a calibrated statistical model.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
