import { useEffect, useState } from 'react';
import { useLoadingStore } from '@/store/useLoadingStore';
import { Loader2 } from 'lucide-react';

/**
 * GlobalLoader — Top-level progress bar and ambient activity indicator.
 * Automatically activates during all background and foreground API requests.
 */
export function GlobalLoader() {
  const isLoading = useLoadingStore((state) => state.isLoading);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timeout;
    if (isLoading) {
      setVisible(true);
    } else {
      // Keep visible for smooth completion animation before unmounting
      timeout = setTimeout(() => setVisible(false), 300);
    }
    return () => clearTimeout(timeout);
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed top-0 left-0 right-0 z-50 overflow-hidden">
      {/* ── Top glowing gradient progress line ── */}
      <div className="h-1 w-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 transition-all duration-300 ${
            isLoading
              ? 'w-full animate-[shimmer_1.5s_infinite_linear]'
              : 'w-full opacity-0'
          }`}
          style={{
            backgroundSize: '200% 100%',
          }}
        />
      </div>

      {/* ── Floating micro activity pill ── */}
      <div className="fixed top-3 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-medium shadow-lg animate-fade-in border border-slate-700/50">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
        <span>Loading...</span>
      </div>
    </div>
  );
}

export default GlobalLoader;
