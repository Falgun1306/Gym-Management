import { cn } from '@/utils/cn';

/**
 * Skeleton loading placeholders matching component library.png mockup.
 */

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-md bg-slate-200/80',
        className
      )}
      {...props}
    />
  );
}

function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-3.5',
            i === lines - 1 ? 'w-3/5' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

function SkeletonCard({ className }) {
  return (
    <div className={cn('ui-card p-5 space-y-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

function SkeletonTable({ rows = 5, cols = 4, className }) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex gap-4 pb-3 border-b border-slate-200">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-2.5">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn('h-4 flex-1', colIndex === 0 && 'w-2/5')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function SkeletonStat({ className }) {
  return (
    <div className={cn('ui-card p-5 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonTable, SkeletonStat };
