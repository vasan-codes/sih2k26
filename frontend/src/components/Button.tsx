import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-accent text-[#160a02] shadow-[0_0_0_1px_rgba(255,138,52,0.5),0_8px_20px_-10px_rgba(255,138,52,0.7)] hover:bg-accent-hover hover:shadow-glow-lg hover:-translate-y-px',
  secondary:
    'glass text-ink-primary border border-border hover:border-accent/60 hover:text-accent hover:-translate-y-px hover:shadow-glow',
  ghost: 'text-ink-secondary hover:text-accent hover:bg-accent/5',
  danger: 'bg-bad/15 text-bad border border-bad/40 hover:bg-bad/25 hover:-translate-y-px',
};

export function Button({
  variant = 'secondary',
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...rest
}: {
  variant?: Variant;
  loading?: boolean;
  icon?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded px-3.5 py-2 text-[13px] font-semibold tracking-tight',
        'transition-all duration-300 ease-out active:scale-[0.97] active:translate-y-0',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none',
        VARIANT_CLASSES[variant],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {/* light sweep on hover */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full group-disabled:hidden" />
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      <span className="relative">{children}</span>
    </button>
  );
}
