import { cn } from '@/utils/cn';
import { Inbox } from 'lucide-react';

/**
 * EmptyState — shown when a data table or list has no data.
 */
function EmptyState({
  icon: Icon = Inbox,
  title = 'No data found',
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-surface-500" />
      </div>
      <h3 className="text-base font-semibold text-surface-300 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-surface-500 max-w-sm mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

export { EmptyState };
