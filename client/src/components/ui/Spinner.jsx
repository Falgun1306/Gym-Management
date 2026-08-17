import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Reusable Spinner component for async data loading and button states.
 * Supports inline, container, and full-screen overlay modes.
 */
export function Spinner({
  size = 'md',
  color = 'emerald',
  label,
  sublabel,
  fullScreen = false,
  overlay = false,
  className,
}) {
  const sizeMap = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorMap = {
    emerald: 'text-emerald-600',
    white: 'text-white',
    slate: 'text-slate-600',
    rose: 'text-rose-600',
  };

  const spinnerContent = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin', sizeMap[size] || sizeMap.md, colorMap[color] || colorMap.emerald)} />
      {label && <p className="text-sm font-semibold text-slate-800 animate-pulse">{label}</p>}
      {sublabel && <p className="text-xs text-slate-500">{sublabel}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in">
        <div className="bg-white/90 p-6 rounded-2xl shadow-xl border border-slate-200/80 flex flex-col items-center">
          {spinnerContent}
        </div>
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-xs rounded-xl transition-opacity animate-fade-in">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
}

export default Spinner;
