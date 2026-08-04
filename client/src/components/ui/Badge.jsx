import { cn } from '@/utils/cn';

/**
 * Badge component matching the exact mockup style in UI design examples.
 * Features soft pastel backgrounds, crisp contrasting text, borders, and status indicator dots.
 */

const variantStyles = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  pending: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  expired: 'bg-red-50 text-red-700 border-red-200/80',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
  frozen: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
  maintenance: 'bg-amber-50 text-amber-700 border-amber-200/80',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  failed: 'bg-red-50 text-red-700 border-red-200/80',
  refunded: 'bg-purple-50 text-purple-700 border-purple-200/80',
  info: 'bg-sky-50 text-sky-700 border-sky-200/80',
};

const dotColors = {
  active: 'bg-emerald-500',
  pending: 'bg-indigo-500',
  expired: 'bg-red-500',
  cancelled: 'bg-slate-400',
  frozen: 'bg-cyan-500',
  maintenance: 'bg-amber-500',
  success: 'bg-emerald-500',
  failed: 'bg-red-500',
  refunded: 'bg-purple-500',
  info: 'bg-sky-500',
  default: 'bg-slate-400',
};

const sizeStyles = {
  sm: 'px-2.5 py-0.5 text-xs rounded-md',
  md: 'px-3 py-1 text-xs rounded-md font-medium',
  lg: 'px-3.5 py-1.5 text-sm rounded-md font-medium',
};

const statusToVariant = {
  // MembershipStatus
  ACTIVE: 'active',
  PENDING: 'pending',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  FROZEN: 'frozen',
  // PaymentStatus
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  // EquipmentStatus
  AVAILABLE: 'active',
  IN_USE: 'info',
  UNDER_MAINTENANCE: 'maintenance',
  DAMAGED: 'expired',
  RETIRED: 'cancelled',
  // ComplaintStatus
  OPEN: 'expired',
  IN_PROGRESS: 'pending',
  RESOLVED: 'success',
  REJECTED: 'cancelled',
  // ApplicationStatus
  APPROVED: 'active',
  // ClassBookingStatus
  BOOKED: 'info',
  ATTENDED: 'active',
  NO_SHOW: 'expired',
  // Difficulty
  BEGINNER: 'active',
  INTERMEDIATE: 'pending',
  ADVANCED: 'expired',
};

function Badge({
  children,
  variant,
  status,
  size = 'md',
  dot = true,
  className,
}) {
  const resolvedVariant = variant || statusToVariant[status] || 'default';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border font-medium whitespace-nowrap leading-none transition-colors',
        variantStyles[resolvedVariant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotColors[resolvedVariant] || 'bg-slate-400'
          )}
        />
      )}
      {children || status}
    </span>
  );
}

export { Badge };
