type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'destructive' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
  'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand hover:bg-brand-hover text-white shadow-brand-glow hover:shadow-panel focus-visible:ring-brand/40',
  secondary:
    'bg-white hover:bg-surface-muted/60 border border-border text-foreground shadow-sm hover:shadow-card focus-visible:ring-brand/30',
  danger:
    'bg-white hover:bg-status-danger-bg border border-status-danger/25 text-status-danger focus-visible:ring-status-danger/30',
  // Final confirmation of a destructive action (dialogs)
  destructive: 'bg-status-danger hover:bg-rose-800 text-white shadow-sm focus-visible:ring-status-danger/40',
  ghost: 'text-ink hover:text-foreground hover:bg-surface-muted/60 focus-visible:ring-brand/30',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-sm',
};

/** Button styling from the landing page CTAs, usable on <button> and <Link>. */
export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  options: { fullWidth?: boolean } = {}
): string {
  return [BASE, VARIANTS[variant], SIZES[size], options.fullWidth ? 'w-full' : ''].join(' ');
}
