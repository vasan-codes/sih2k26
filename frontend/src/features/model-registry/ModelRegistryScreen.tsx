import { api } from '../../api/client';
import { useAsync } from '../../hooks/useAsync';
import { TopBar } from '../../layout/AppShell';
import { LoadingState, ErrorState } from '../../components/States';
import { Panel } from '../../components/Panel';

export function ModelRegistryScreen() {
  const { data: models, loading, error, reload } = useAsync(() => api.listModels(), []);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar
        title="Model Registry"
        subtitle="SatQuery AI's TaskRouter selects from this registry at run time — it never hardcodes a model choice."
      />
      <div className="flex-1 overflow-y-auto p-8">
        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={reload} />}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {models?.map((m) => (
            <Panel key={m.id} eyebrow={m.task.replace(/_/g, ' ')} title={`${m.name} · v${m.version}`}>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded border border-ok/30 bg-ok/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-ok">
                <span className="h-1.5 w-1.5 rounded-full bg-ok" /> {m.status}
              </div>
              <p className="text-sm text-ink-secondary">{m.capabilities}</p>
              <div className="mt-3 grid grid-cols-1 gap-1.5 text-xs">
                <div><span className="text-ink-muted">Input: </span><span className="text-ink-primary">{m.input_type}</span></div>
                <div><span className="text-ink-muted">Output: </span><span className="text-ink-primary">{m.output_type}</span></div>
              </div>
              <div className="mt-3 rounded border border-border-subtle bg-surface-raised p-2 text-xs text-ink-muted">
                {m.performance_notes}
              </div>
            </Panel>
          ))}
        </div>
      </div>
    </div>
  );
}
