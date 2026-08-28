import clsx from 'clsx';

export type StageStatus = 'waiting' | 'running' | 'completed' | 'warning' | 'failed';

export const PIPELINE_STAGES: { key: string; label: string }[] = [
  { key: 'query_understanding', label: 'Understanding Query' },
  { key: 'input_validation', label: 'Validating Inputs' },
  { key: 'workflow_selection', label: 'Selecting Workflow' },
  { key: 'service_selection', label: 'Selecting Specialist Services' },
  { key: 'workflow_execution', label: 'Executing Analysis' },
  { key: 'evidence_aggregation', label: 'Aggregating Evidence' },
  { key: 'evidence_validation', label: 'Validating Evidence' },
  { key: 'confidence_estimation', label: 'Estimating Confidence' },
  { key: 'answer_generation', label: 'Generating Evidence-Grounded Answer' },
];

function Dot({ status }: { status: StageStatus }) {
  if (status === 'completed') {
    return <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ok/20 text-[11px] font-bold text-ok">✓</span>;
  }
  if (status === 'warning') {
    return <span className="flex h-5 w-5 items-center justify-center rounded-full bg-warn/20 text-[11px] font-bold text-warn">!</span>;
  }
  if (status === 'failed') {
    return <span className="flex h-5 w-5 items-center justify-center rounded-full bg-bad/20 text-[11px] font-bold text-bad">✕</span>;
  }
  if (status === 'running') {
    return (
      <span className="relative flex h-5 w-5 items-center justify-center">
        <span className="absolute h-5 w-5 animate-ping rounded-full bg-accent/30" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent" />
      </span>
    );
  }
  return <span className="h-5 w-5 rounded-full border-2 border-border" />;
}

export function StageList({ statuses }: { statuses: Record<string, StageStatus> }) {
  return (
    <ol className="space-y-0.5">
      {PIPELINE_STAGES.map((stage, i) => {
        const status = statuses[stage.key] ?? 'waiting';
        return (
          <li key={stage.key} className="flex items-center gap-3 py-1.5">
            <div className="flex flex-col items-center">
              <Dot status={status} />
              {i < PIPELINE_STAGES.length - 1 && (
                <span
                  className={clsx('h-4 w-px', status === 'completed' ? 'bg-ok/40' : 'bg-border')}
                />
              )}
            </div>
            <span
              className={clsx(
                'text-[13px]',
                status === 'waiting' ? 'text-ink-muted' : 'text-ink-primary',
                status === 'running' && 'font-semibold text-accent',
              )}
            >
              {stage.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
