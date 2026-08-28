import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

const NAV_SECTIONS: { label: string; items: { to: string; label: string; icon: string }[] }[] = [
  {
    label: 'Mission',
    items: [
      { to: '/', label: 'Dashboard', icon: '◈' },
      { to: '/new-analysis', label: 'New Analysis', icon: '✦' },
      { to: '/missions', label: 'Mission History', icon: '☰' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/region-intelligence', label: 'Region Intelligence', icon: '⬡' },
      { to: '/knowledge-graph', label: 'Knowledge Graph', icon: '◎' },
      { to: '/correlation', label: 'Cross-Domain Correlation', icon: '∿' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { to: '/models', label: 'Model Registry', icon: '▤' },
      { to: '/benchmark', label: 'Benchmark / Evaluation', icon: '▦' },
      { to: '/settings', label: 'Settings', icon: '⚙' },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-space text-ink-primary">
      {/* drifting nebula glow layer */}
      <div className="pointer-events-none absolute inset-0 bg-aurora" />

      <aside className="relative z-10 flex w-60 shrink-0 flex-col border-r border-border-subtle bg-surface/70 backdrop-blur-xl">
        <div className="flex items-center gap-2.5 border-b border-border-subtle px-4 py-4">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-accent/40 bg-accent-soft text-accent shadow-glow">
            {/* orbiting satellite dot */}
            <span className="pointer-events-none absolute inset-0 animate-orbit">
              <span className="absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 rounded-full bg-accent shadow-glow" />
            </span>
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none">
              <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="12" cy="12" r="1.6" fill="currentColor" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="text-[13px] font-bold leading-none tracking-tight">SatQuery AI</div>
            <div className="mt-1 text-[9px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              Earth Observation Intelligence
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-5">
              <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      clsx(
                        'group relative flex items-center gap-2.5 overflow-hidden rounded-md px-2.5 py-2 text-[13px] font-medium transition-all duration-200',
                        isActive
                          ? 'bg-accent-soft text-accent shadow-[inset_0_0_0_1px_rgba(63,182,232,0.2)]'
                          : 'text-ink-secondary hover:translate-x-0.5 hover:bg-white/5 hover:text-ink-primary',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={clsx(
                            'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent transition-all duration-300',
                            isActive ? 'opacity-100 shadow-glow' : 'opacity-0 group-hover:opacity-40',
                          )}
                        />
                        <span
                          className={clsx(
                            'w-4 text-center text-[13px] transition-transform duration-200 group-hover:scale-110',
                            isActive ? 'opacity-100' : 'opacity-80',
                          )}
                        >
                          {item.icon}
                        </span>
                        {item.label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border-subtle px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] text-ink-muted">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ok" />
            </span>
            Prototype backend online
          </div>
        </div>
      </aside>

      <main className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}

export function TopBar({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="relative flex shrink-0 items-center justify-between border-b border-border-subtle bg-surface/50 px-6 py-4 backdrop-blur-xl">
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="animate-fade-in">
        <h1 className="text-lg font-bold text-ink-primary">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-secondary">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </header>
  );
}
