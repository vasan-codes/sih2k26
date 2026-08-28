import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAsync } from '../../hooks/useAsync';
import { TopBar } from '../../layout/AppShell';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';

export function MissionHistory() {
  const navigate = useNavigate();
  const { data: missions, loading, error, reload } = useAsync(() => api.listMissions(), []);

  async function toggleSave(id: string, saved: boolean) {
    await api.updateMissionFeedback(id, { saved: !saved });
    reload();
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar title="Mission History" subtitle="Every analysis this platform has run — query, workflow, and outcome." />
      <div className="flex-1 overflow-y-auto p-8">
        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {missions && missions.length === 0 && <EmptyState title="No missions yet" detail="Start a New Analysis to populate mission history." />}

        <div className="overflow-hidden rounded-lg border border-border-subtle">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-raised text-[11px] uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Mission</th>
                <th className="px-4 py-3 font-semibold">Mode</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle bg-surface">
              {missions?.map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="max-w-sm px-4 py-3">
                    <div className="truncate font-medium text-ink-primary">{m.title}</div>
                    <div className="truncate text-xs text-ink-muted">{m.query_text}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-secondary">{m.mode.replace('_', ' ')}</td>
                  <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">{new Date(m.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => toggleSave(m.id, m.saved)} className={`text-xs ${m.saved ? 'text-accent' : 'text-ink-muted hover:text-ink-primary'}`}>
                        {m.saved ? '★ Saved' : '☆ Save'}
                      </button>
                      <Button
                        variant="ghost"
                        className="px-2 py-1 text-xs"
                        onClick={() => navigate(m.status === 'completed' ? `/results/${m.id}` : `/workspace/${m.id}`)}
                      >
                        Open →
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
