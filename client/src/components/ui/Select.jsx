import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Controlled Select dropdown matching UI design example mockups.
 */
const Select = forwardRef(
  (
    {
      label,
      error,
      options = [],
      placeholder = 'Select...',
      className,
      containerClassName,
      id,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full rounded-lg border bg-white text-slate-900 shadow-2xs',
              'transition-all duration-150 appearance-none',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50',
              'px-3.5 py-2 pr-10 text-sm',
              error
                ? 'border-red-500/80 focus:ring-red-500/20 focus:border-red-600'
                : 'border-slate-300 hover:border-slate-400',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children ||
              options.map((opt) => {
                const value = typeof opt === 'object' ? opt.value : opt;
                const label = typeof opt === 'object' ? opt.label : opt;
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
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

Select.displayName = 'Select';

export { Select };
