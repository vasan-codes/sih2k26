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
    <section
      className={clsx(
        'group relative animate-fade-up overflow-hidden rounded-md border border-border-subtle bg-surface/80 shadow-panel backdrop-blur-sm',
        'transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-panel-hover',
        className,
      )}
    >
      {/* instrument corner ticks (reveal on hover) */}
      <span className="corner-ticks pointer-events-none absolute inset-0 z-10" />
      {/* top accent rule */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      {(title || actions || eyebrow) && (
        <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
          <div>
            {eyebrow && (
              <div className="mb-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-accent/70">
                {eyebrow}
              </div>
            )}
            {title && <h2 className="font-display text-sm font-semibold tracking-tight text-ink-primary">{title}</h2>}
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
    <div className={clsx('font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-accent/70', className)}>
      {children}
    </div>
  );
}
