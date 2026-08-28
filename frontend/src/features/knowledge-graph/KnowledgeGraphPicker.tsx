import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAsync } from '../../hooks/useAsync';
import { TopBar } from '../../layout/AppShell';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { StatusBadge } from '../../components/StatusBadge';

export function KnowledgeGraphPicker() {
  const navigate = useNavigate();
  const { data: missions, loading, error, reload } = useAsync(() => api.listMissions(), []);
  const completed = missions?.filter((m) => m.status === 'completed') ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar title="Knowledge Graph" subtitle="Generated live from a mission's real observations, evidence and relationships — select a mission to explore." />
      <div className="flex-1 overflow-y-auto p-8">
        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {!loading && completed.length === 0 && <EmptyState title="No completed missions yet" detail="Run an analysis first." />}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {completed.map((m) => (
            <button
              key={m.id}
              onClick={() => navigate(`/knowledge-graph/${m.id}`)}
              className="rounded-lg border border-border-subtle bg-surface p-4 text-left transition-colors hover:border-accent/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-ink-primary">{m.title}</span>
                <StatusBadge status={m.status} />
              </div>
              <p className="mt-1 text-xs text-ink-muted">{m.query_text}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
