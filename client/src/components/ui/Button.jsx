import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Button component matching the UI design examples layout and visual style.
 *
 * Variants: primary, secondary, outline, danger, ghost
 * Sizes: sm, md, lg
 */

const variantStyles = {
  primary:
    'bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900 shadow-xs border border-emerald-700/50',
  secondary:
    'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 border border-slate-200/80',
  outline:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 shadow-xs',
  danger:
    'bg-red-700 text-white hover:bg-red-800 active:bg-red-900 shadow-xs border border-red-700/50',
  ghost:
    'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5 font-medium',
  md: 'px-4 py-2 text-sm rounded-lg gap-2 font-medium',
  lg: 'px-5 py-2.5 text-base rounded-xl gap-2.5 font-medium',
};

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      icon: Icon,
      iconRight: IconRight,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center transition-all duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          'cursor-pointer select-none',
          // Variant + size
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className={cn('animate-spin', size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
        ) : Icon ? (
          <Icon className={cn(size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
        ) : null}

        {children}

        {IconRight && !loading && (
          <IconRight className={cn(size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
