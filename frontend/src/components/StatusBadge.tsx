import clsx from 'clsx';

type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral';

const TONE_CLASSES: Record<Tone, string> = {
  ok: 'bg-ok/15 text-ok border-ok/30',
  warn: 'bg-warn/15 text-warn border-warn/30',
  bad: 'bg-bad/15 text-bad border-bad/30',
  info: 'bg-accent/15 text-accent border-accent/30',
  neutral: 'bg-white/5 text-ink-secondary border-border',
};

const STATUS_TONE: Record<string, Tone> = {
  SUPPORTED: 'ok',
  PARTIALLY_SUPPORTED: 'warn',
  CONFLICT_DETECTED: 'bad',
  INSUFFICIENT_EVIDENCE: 'warn',
  HIGH_AGREEMENT: 'ok',
  PARTIAL_AGREEMENT: 'warn',
  HIGH_AGREEMENT_LEVEL: 'ok',
  supported: 'ok',
  partially_supported: 'warn',
  conflict: 'bad',
  insufficient: 'warn',
  completed: 'ok',
  running: 'info',
  pending: 'neutral',
  failed: 'bad',
  warning: 'warn',
  POSSIBLE_ASSOCIATION: 'info',
  WEAK_ASSOCIATION: 'neutral',
  NO_ASSOCIATION_OBSERVED: 'neutral',
  INSUFFICIENT_DATA: 'neutral',
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = STATUS_TONE[status] ?? 'neutral';
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        TONE_CLASSES[tone],
      )}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full', {
        'bg-ok': tone === 'ok',
        'bg-warn': tone === 'warn',
        'bg-bad': tone === 'bad',
        'bg-accent': tone === 'info',
        'bg-ink-muted': tone === 'neutral',
      })} />
      {(label ?? status).replace(/_/g, ' ')}
    </span>
  );
}

export function CheckRow({ label, status, detail }: { label: string; status: boolean; detail?: string }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <span
        className={clsx(
          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
          status ? 'bg-ok/20 text-ok' : 'bg-bad/20 text-bad',
        )}
      >
        {status ? '✓' : '✕'}
      </span>
      <div className="min-w-0">
        <div className="text-[13px] text-ink-primary">{label}</div>
        {detail && <div className="text-xs text-ink-muted">{detail}</div>}
      </div>
    </div>
  );
}
