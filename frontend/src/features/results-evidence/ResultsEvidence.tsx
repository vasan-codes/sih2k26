import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAsync } from '../../hooks/useAsync';
import { LoadingState, ErrorState } from '../../components/States';
import { Panel } from '../../components/Panel';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import { ConfidenceMeter } from '../../components/ConfidenceMeter';
import { TopBar } from '../../layout/AppShell';

export function ResultsEvidence() {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const { data: mission, loading, error, reload } = useAsync(() => api.getMission(missionId!), [missionId]);
  const [generating, setGenerating] = useState(false);

  async function downloadReport() {
    if (!mission) return;
    setGenerating(true);
    try {
      const report = await api.generateReport(mission.id);
      const blob = new Blob([report.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `satquery-report-${mission.id}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <LoadingState label="Loading results…" />;
  if (error || !mission) return <ErrorState message={error ?? 'Mission not found'} onRetry={reload} />;
  if (!mission.result) return <ErrorState message="This mission has no result yet." />;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar
        title="Results & Evidence"
        subtitle={mission.title}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate(`/workspace/${mission.id}`)}>Open Workspace</Button>
            <Button variant="primary" loading={generating} onClick={downloadReport}>Generate Report</Button>
          </>
        }
      />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Panel eyebrow={mission.result.demo_label} title="AI Assessment">
              <p className="text-sm leading-relaxed text-ink-primary">{mission.result.answer}</p>
            </Panel>

            <Panel title="Key Findings">
              <ul className="space-y-2 text-sm text-ink-secondary">
                {mission.result.key_findings.map((k, i) => (
                  <li key={i} className="flex gap-2"><span className="text-accent">→</span>{k}</li>
                ))}
              </ul>
            </Panel>

            <Panel title="Supporting Evidence" eyebrow={`${mission.evidence_items.length} evidence object(s)`}>
              <div className="space-y-3">
                {mission.evidence_items.map((e) => (
                  <div key={e.id} className="rounded-md border border-border-subtle p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-semibold text-ink-primary">{e.title}</span>
                      <StatusBadge status={e.validation_status} />
                    </div>
                    <p className="mt-1 text-xs text-ink-secondary">{e.description}</p>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-ink-muted">
                      <span>Source: {e.source_service}</span>
                      <span>Strength: {Math.round(e.strength * 100)}%</span>
                      <span>{e.geometry ? 'Spatially located' : 'Non-spatial'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            {mission.result.uncertainty.length > 0 && (
              <Panel title="Uncertainty / Limitations" className="border-warn/30">
                <ul className="space-y-1.5 text-sm text-ink-secondary">
                  {mission.result.uncertainty.map((u, i) => (
                    <li key={i} className="flex gap-2"><span className="text-warn">!</span>{u}</li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>

          <div className="space-y-5">
            <Panel title="Evidence Safety Status">
              <StatusBadge status={mission.result.evidence_validation.status} />
              <ul className="mt-2 space-y-1 text-xs text-ink-secondary">
                {mission.result.evidence_validation.notes.map((n, i) => <li key={i}>• {n}</li>)}
              </ul>
            </Panel>

            {mission.confidence && (
              <Panel title="Confidence Breakdown">
                <ConfidenceMeter confidence={mission.confidence} />
              </Panel>
            )}

            {mission.result.sensor_consistency && (
              <Panel title="Sensor Consistency Status">
                <StatusBadge status={mission.result.sensor_consistency.level} />
                <div className="mt-2 space-y-1.5 text-xs text-ink-secondary">
                  <p>{mission.result.sensor_consistency.optical_interpretation}</p>
                  <p>{mission.result.sensor_consistency.sar_interpretation}</p>
                </div>
              </Panel>
            )}

            <Panel eyebrow="Inputs" title="Observations used">
              <div className="space-y-2">
                {mission.observations.map((o) => (
                  <div key={o.id} className="text-xs">
                    <div className="font-semibold text-ink-primary">{o.name}</div>
                    <div className="text-ink-muted">{o.sensor_type} · {new Date(o.acquisition_time).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
