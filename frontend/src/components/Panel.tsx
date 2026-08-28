import type { ReactNode } from 'react';
import clsx from 'clsx';

export function Panel({
  title,
  eyebrow,
  actions,
  children,
  className,
  bodyClassName,
  noPadding,
}: {
  title?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
}) {
  return (
    <section className={clsx('rounded-lg border border-border-subtle bg-surface shadow-panel', className)}>
      {(title || actions || eyebrow) && (
        <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
          <div>
            {eyebrow && (
              <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                {eyebrow}
              </div>
            )}
            {title && <h2 className="text-sm font-semibold text-ink-primary">{title}</h2>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={clsx(!noPadding && 'p-4', bodyClassName)}>{children}</div>
    </section>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted', className)}>
      {children}
    </div>
  );
}
