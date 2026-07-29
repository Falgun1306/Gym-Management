import { AlertTriangle, Trash2, Info, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { cn } from '@/utils/cn';

/**
 * ConfirmDialog — action confirmation overlay matching component library.png design mockup.
 *
 * Variants:
 *  - danger: Light red icon container + red action button (e.g., Revoke Membership, Delete)
 *  - warning: Light amber icon container + primary button
 *  - success: Light green icon container + emerald button (Success Modal from mockup)
 *  - info: Light blue icon container + info button
 */

const variantConfig = {
  danger: {
    Icon: Trash2,
    iconBg: 'bg-red-50 text-red-600 border-red-200',
    confirmVariant: 'danger',
  },
  warning: {
    Icon: AlertTriangle,
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
    confirmVariant: 'primary',
  },
  success: {
    Icon: CheckCircle2,
    iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    confirmVariant: 'primary',
  },
  info: {
    Icon: Info,
    iconBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    confirmVariant: 'primary',
  },
};

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  const config = variantConfig[variant] || variantConfig.danger;
  const { Icon, iconBg, confirmVariant } = config;

  return (
    <Modal open={open} onClose={onClose} size="sm" showClose={false}>
      <div className="flex items-start gap-4 p-2">
        {/* Icon box matching mockup */}
        <div
          className={cn(
            'w-11 h-11 rounded-lg border flex items-center justify-center shrink-0 mt-0.5',
            iconBg
          )}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="space-y-1 flex-1">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {description && (
            <p className="text-xs text-slate-500 leading-relaxed">
              {description}
            </p>
          )}

          {/* Action buttons matching mockup layout */}
          <div className="flex items-center justify-end gap-2.5 pt-4">
            {cancelText && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={loading}
              >
                {cancelText}
              </Button>
            )}
            <Button
              variant={confirmVariant}
              size="sm"
              onClick={onConfirm}
              loading={loading}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export { ConfirmDialog };
