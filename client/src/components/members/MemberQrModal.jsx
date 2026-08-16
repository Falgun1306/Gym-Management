import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useMemberQrCode } from '@/hooks/useMemberPortal';
import { Clock, RefreshCw, AlertCircle, Loader2, ShieldCheck, Check } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * MemberQrModal component for displaying and refreshing the digital entrance pass.
 * Includes explicit visual loading spinners and indicators during QR generation and refresh.
 */
export function MemberQrModal({ open, onClose }) {
  const {
    data: qrData,
    isLoading: qrLoading,
    isFetching: qrFetching,
    error: qrError,
    refetch: refetchQr,
  } = useMemberQrCode(open);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);

  // Clear justRefreshed timer if modal closes
  useEffect(() => {
    if (!open) {
      setJustRefreshed(false);
    }
  }, [open]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setJustRefreshed(false);
    try {
      const res = await refetchQr();
      if (res.isSuccess) {
        toast.success('Entrance QR pass refreshed!');
        setJustRefreshed(true);
        setTimeout(() => setJustRefreshed(false), 2500);
      } else if (res.isError) {
        toast.error(res.error?.message || 'Failed to refresh QR pass');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to refresh QR pass');
    } finally {
      setIsRefreshing(false);
    }
  };

  const isBusy = qrFetching || isRefreshing;
  const qrImageSrc =
    qrData?.qrCodeDataUrl ||
    qrData?.qrCodeUrl ||
    (qrData?.token || qrData?.qrToken
      ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
          qrData.token || qrData.qrToken
        )}`
      : null);

  return (
    <Modal open={open} onClose={onClose} title="Digital Entrance QR Pass">
      <div className="text-center space-y-4 py-2">
        <p className="text-xs text-slate-500">
          Scan this QR code at the facility entrance scanner for instant check-in. Valid for 5 minutes.
        </p>

        {/* QR Code Card Box */}
        <div className="relative bg-slate-900 p-6 rounded-2xl inline-block shadow-xl border border-slate-800 overflow-hidden min-w-[240px] min-h-[240px]">
          {/* Initial Loading State */}
          {qrLoading && !qrData ? (
            <div className="w-48 h-48 rounded-lg flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin absolute" />
              </div>
              <p className="text-xs font-semibold text-slate-300 animate-pulse">
                Generating Pass...
              </p>
            </div>
          ) : qrImageSrc ? (
            <div className="relative inline-block">
              {/* Main QR Image */}
              <img
                src={qrImageSrc}
                alt="Member Entrance QR"
                className={`w-48 h-48 mx-auto rounded-lg shadow-lg bg-white p-2 transition-all duration-200 ${
                  isBusy ? 'opacity-30 blur-[1px]' : 'opacity-100'
                }`}
              />

              {/* Loader Overlay when Refreshing */}
              {isBusy && (
                <div className="absolute inset-0 rounded-lg bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 transition-all duration-200 z-10">
                  <div className="relative flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
                    <Loader2 className="w-5 h-5 text-emerald-400 animate-spin absolute" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-300 animate-pulse">
                    Refreshing QR...
                  </span>
                </div>
              )}

              {/* Success Badge on Refresh */}
              {justRefreshed && !isBusy && (
                <div className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 shadow-md animate-bounce z-20">
                  <Check className="w-3 h-3 stroke-[3]" /> Refreshed
                </div>
              )}
            </div>
          ) : (
            /* Error State */
            <div className="w-48 h-48 rounded-lg flex flex-col items-center justify-center p-4 text-slate-400 text-xs text-center">
              <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
              <p className="font-semibold text-rose-400 mb-1">QR Generation Issue</p>
              <p className="text-[11px] text-slate-400 mb-3">
                {qrError?.message || 'Failed to load QR code. Active membership required.'}
              </p>
              <Button variant="outline" size="sm" onClick={handleRefresh} loading={isBusy}>
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Security & Status Info */}
        <div className="flex items-center justify-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            {isBusy ? (
              <span className="text-emerald-600 font-medium animate-pulse">Fetching new token...</span>
            ) : (
              'Pass refreshes automatically'
            )}
          </span>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            Encrypted JWT Pass
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={isBusy}
            disabled={qrLoading}
            icon={RefreshCw}
          >
            {isBusy ? 'Refreshing...' : 'Refresh Pass'}
          </Button>
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default MemberQrModal;
