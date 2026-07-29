import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

/**
 * Controlled Input component matching UI design example mockups.
 */
const Input = forwardRef(
  (
    {
      label,
      error,
      icon: Icon,
      className,
      containerClassName,
      type = 'text',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              'w-full rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 shadow-2xs',
              'transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50',
              Icon ? 'pl-10 pr-4' : 'px-3.5',
              'py-2 text-sm',
              error
                ? 'border-red-500/80 focus:ring-red-500/20 focus:border-red-600'
                : 'border-slate-300 hover:border-slate-400',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
            <span className="w-1 h-1 bg-red-600 rounded-full shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Textarea variant of the Input component.
 */
const Textarea = forwardRef(
  ({ label, error, className, containerClassName, id, rows = 4, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={cn(
            'w-full rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 shadow-2xs',
            'transition-all duration-150 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50',
            'px-3.5 py-2 text-sm',
            error
              ? 'border-red-500/80 focus:ring-red-500/20 focus:border-red-600'
              : 'border-slate-300 hover:border-slate-400',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
            <span className="w-1 h-1 bg-red-600 rounded-full shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Input, Textarea };
