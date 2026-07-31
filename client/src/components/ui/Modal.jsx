import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Modal overlay matching UI design example mockups.
 * Clean white surface, slate border, soft shadow, backdrop blur.
 * Uses React Portal to avoid CSS stacking context traps with sticky headers.
 */

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[90vw]',
};

function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
  className,
  footer,
}) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'relative w-full bg-white border border-slate-200 rounded-xl shadow-xl',
          'animate-fade-in',
          'max-h-[85vh] flex flex-col',
          sizeStyles[size],
          className
        )}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100">
            <div className="space-y-0.5 flex-1 pr-4">
              {title && (
                <h2 className="text-base font-semibold text-slate-900">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-slate-500">{description}</p>
              )}
            </div>
            {showClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export { Modal };
