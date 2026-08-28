import clsx from 'clsx';
import type { ConfidenceBreakdown } from '../api/types';

function toneForValue(v: number) {
  if (v >= 0.75) return 'bg-ok';
  if (v >= 0.5) return 'bg-warn';
  return 'bg-bad';
}

const COMPONENT_LABELS: Record<string, string> = {
  model_confidence: 'Model Confidence',
  evidence_strength: 'Evidence Strength',
  input_quality: 'Input Quality',
  spatial_consistency: 'Spatial Consistency',
  temporal_consistency: 'Temporal Consistency',
  cross_sensor_agreement: 'Cross-Sensor Agreement',
};

export function ConfidenceMeter({ confidence }: { confidence: ConfidenceBreakdown }) {
  const overall = confidence.overall_percent;
  const overallTone = overall >= 75 ? 'text-ok' : overall >= 50 ? 'text-warn' : 'text-bad';

  return (
    <div>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
            {confidence.label}
          </div>
          <div className={clsx('font-mono text-3xl font-bold', overallTone)}>{overall}%</div>
        </div>
      </div>
      <div className="space-y-2.5">
        {Object.entries(confidence.components).map(([key, value]) => (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-ink-secondary">{COMPONENT_LABELS[key] ?? key}</span>
              <span className="font-mono text-ink-primary">
                {key === 'cross_sensor_agreement' && !confidence.cross_sensor_applicable
                  ? 'N/A'
                  : `${Math.round(value * 100)}%`}
                <span className="ml-1.5 text-ink-muted">×{confidence.weights[key]}</span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className={clsx('h-full rounded-full transition-all', toneForValue(value))}
                style={{ width: `${Math.round(value * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
