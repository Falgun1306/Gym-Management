import { cn } from '@/utils/cn';

/**
 * Card — matching the UI design example mockups.
 * Clean white surface, slate border, soft shadow, rounded-xl.
 */
function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        hover ? 'ui-card-hover' : 'ui-card',
        'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * CardHeader — top section of a card with title and optional action.
 */
function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('flex items-start justify-between mb-4', className)}>
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * StatCard — matching the KPI cards from component library.png and admin dashboard.png.
 */
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  iconBg = 'bg-slate-100 text-slate-700',
  className,
}) {
  const trendPositive = trend > 0;
  const trendNegative = trend < 0;

  return (
    <Card className={cn('p-5 space-y-3', className)}>
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </p>
        {Icon && (
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
        {(subtitle || trend != null) && (
          <div className="flex items-center gap-1.5 text-xs mt-1">
            {trend != null && (
              <span
                className={cn(
                  'flex items-center gap-0.5 font-semibold',
                  trendPositive && 'text-emerald-700',
                  trendNegative && 'text-rose-600',
                  !trendPositive && !trendNegative && 'text-slate-500'
                )}
              >
                {trendPositive ? '↗' : trendNegative ? '↘' : '→'} {trendPositive ? '+' : ''}{trend}%
              </span>
            )}
            {(trendLabel || subtitle) && (
              <span className="text-slate-500 font-medium">{trendLabel || subtitle}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export { Card, CardHeader, StatCard };
