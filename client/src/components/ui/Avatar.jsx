import { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { getInitials } from '@/utils/formatters';

/**
 * Avatar component matching UI design example mockups.
 */

const sizeStyles = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-xs',
  lg: 'w-11 h-11 text-sm',
  xl: 'w-14 h-14 text-base',
};

const Avatar = forwardRef(
  ({ firstName, lastName, src, size = 'md', className, ...props }, ref) => {
    const initials = getInitials(firstName, lastName);

    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-full flex items-center justify-center font-semibold border border-slate-200/80',
          'bg-slate-100 text-slate-700',
          'shrink-0 select-none overflow-hidden shadow-2xs',
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={`${firstName || ''} ${lastName || ''}`}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          initials
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
