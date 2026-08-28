import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-accent text-[#04141c] hover:bg-accent-hover shadow-[0_0_0_1px_rgba(63,182,232,0.4)] hover:shadow-glow',
  secondary:
    'bg-surface-raised text-ink-primary border border-border hover:border-accent/60 hover:text-accent',
  ghost: 'text-ink-secondary hover:text-ink-primary hover:bg-white/5',
  danger: 'bg-bad/90 text-white hover:bg-bad',
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
        'inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold',
        'transition-all duration-150 ease-out active:scale-[0.98]',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none',
        VARIANT_CLASSES[variant],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
