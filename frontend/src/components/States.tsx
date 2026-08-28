export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-16 text-sm text-ink-muted">
      <span className="mr-2.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="text-sm font-semibold text-bad">Something went wrong</div>
      <div className="max-w-md text-xs text-ink-muted">{message}</div>
      {onRetry && (
        <button onClick={onRetry} className="mt-1 rounded-md border border-border px-3 py-1.5 text-xs text-ink-secondary hover:text-accent">
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-16 text-center">
      <div className="text-sm font-semibold text-ink-secondary">{title}</div>
      {detail && <div className="max-w-md text-xs text-ink-muted">{detail}</div>}
    </div>
  );
}
