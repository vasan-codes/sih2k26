import { api } from '../../api/client';
import { useAsync } from '../../hooks/useAsync';
import { TopBar } from '../../layout/AppShell';
import { Panel } from '../../components/Panel';
import { LoadingState } from '../../components/States';

export function Benchmark() {
  const { data: models, loading } = useAsync(() => api.listModels(), []);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar title="Benchmark / Evaluation" subtitle="Honest evaluation status — no fabricated accuracy or benchmark scores." />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-4xl space-y-5">
          <Panel eyebrow="Public Benchmarks" title="Standard remote-sensing VQA / change-detection benchmarks">
            <p className="text-sm text-ink-secondary">
              No public benchmark run (e.g. RSVQA, LEVIR-CD, OSCD) has been executed against this prototype's
              services. The specialist services in this build are deterministic rule-based implementations over
              synthetic demo imagery, not trained models — running them against a real benchmark would not produce
              a meaningful accuracy figure.
            </p>
          </Panel>

          <Panel eyebrow="Custom Validation" title="Task-level evaluation status">
            {loading && <LoadingState />}
            <div className="divide-y divide-border-subtle">
              {models?.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="text-[13px] font-semibold text-ink-primary">{m.task.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-ink-muted">{m.name} · v{m.version}</div>
                  </div>
                  <span className="rounded border border-border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                    Not Evaluated
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Evaluation Status" title="What real evaluation would require">
            <ul className="space-y-2 text-sm text-ink-secondary">
              <li>• A labeled benchmark dataset per task (e.g. RSVQA for VQA, LEVIR-CD for change detection).</li>
              <li>• Trained model weights replacing the current deterministic prototype logic.</li>
              <li>• A held-out evaluation split with standard metrics (accuracy, IoU, F1) computed and stored here.</li>
            </ul>
            <p className="mt-3 text-xs text-ink-muted">
              This screen is wired to the live Model Registry — once a real evaluation run is recorded, its metrics
              would replace the "Not Evaluated" badges above automatically.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
