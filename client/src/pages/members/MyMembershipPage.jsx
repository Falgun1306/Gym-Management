import { useState } from 'react';
import {
  useMemberSubscriptions,
  useMemberPayments,
  useMemberReferralLink,
  useFreezeMembership,
  useUnfreezeMembership,
  useAvailableMembershipPlans,
  usePurchaseMembership,
  useRetryPayment,
  useFailPayment,
  useValidateCoupon,
} from '@/hooks/useMemberPortal';
import { verifyPayment, downloadPaymentInvoice } from '@/services/memberPortalService';
import { Card, CardHeader, Badge, Button, Modal, SkeletonTable } from '@/components/ui';
import {
  CreditCard,
  Calendar,
  Share2,
  Copy,
  Check,
  Pause,
  Play,
  Download,
  Receipt,
  Gift,
  ShieldCheck,
  TrendingUp,
  Tag,
  Ticket,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/utils/formatters';
import toast from 'react-hot-toast';

export default function MyMembershipPage() {
  const [paymentPage, setPaymentPage] = useState(1);
  const paymentLimit = 10;
  const { data: subscriptions = [], isLoading: subsLoading } = useMemberSubscriptions();
  const { data: paymentData, isLoading: paymentsLoading } = useMemberPayments({ page: paymentPage, limit: paymentLimit });
  const { data: referralData } = useMemberReferralLink();

  const [copied, setCopied] = useState(false);
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [freezeDays, setFreezeDays] = useState(7);
  const [freezeReason, setFreezeReason] = useState('');
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);

  const handleDownloadInvoice = async (paymentId) => {
    try {
      setDownloadingInvoiceId(paymentId);
      const blob = await downloadPaymentInvoice(paymentId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to download invoice');
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const freezeMutation = useFreezeMembership();
  const unfreezeMutation = useUnfreezeMembership();

  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [selectedPlanToPurchase, setSelectedPlanToPurchase] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('ONLINE');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const validateCouponMutation = useValidateCoupon();

  const { data: availablePlans = [], isLoading: plansLoading } = useAvailableMembershipPlans();
  const purchaseMutation = usePurchaseMembership();
  const retryMutation = useRetryPayment();
  const failMutation = useFailPayment();

  const handlePurchaseClick = (plan) => {
    setSelectedPlanToPurchase(plan);
    setPaymentMethod('ONLINE');
    setCouponInput('');
    setAppliedCoupon(null);
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponInput.trim() || !selectedPlanToPurchase) return;

    validateCouponMutation.mutate(
      {
        code: couponInput.trim(),
        amount: selectedPlanToPurchase.price,
        planId: selectedPlanToPurchase.id,
      },
      {
        onSuccess: (res) => {
          setAppliedCoupon(res.data);
          toast.success(`Coupon "${res.data.code}" applied!`);
        },
        onError: (err) => {
          setAppliedCoupon(null);
          toast.error(err.message || 'Invalid coupon code');
        },
      }
    );
  };

  const handleRemoveCoupon = () => {
    setCouponInput('');
    setAppliedCoupon(null);
    toast.success('Coupon removed');
  };

  const submitPurchase = async () => {
    if (!selectedPlanToPurchase) return;
    const isCash = paymentMethod === 'CASH';
    const msg = isCash
      ? 'Are you sure you want to request this membership via Cash? It will require admin approval.'
      : 'Are you sure you want to purchase this membership? You will be redirected to the payment gateway.';

    if (confirm(msg)) {
      purchaseMutation.mutate(
        {
          planId: selectedPlanToPurchase.id,
          paymentMethod,
          couponCode: appliedCoupon?.code || undefined,
        },
        {
          onSuccess: async (res) => {
            if (res.data?.razorpayOrderId && res.data?.key_id) {
              const resLoad = await loadRazorpay();
              if (!resLoad) {
                toast.error('Failed to load Razorpay SDK. Are you online?');
                return;
              }

              const options = {
                key: res.data.key_id,
                amount: res.data.amount,
                currency: 'INR',
                name: 'Gym Management',
                description: `Purchase ${selectedPlanToPurchase.name}`,
                order_id: res.data.razorpayOrderId,
                handler: async function (response) {
                  try {
                    await verifyPayment({
                      paymentId: res.data.id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_signature: response.razorpay_signature,
                    });
                    toast.success('Payment verified successfully!');
                    handleClosePurchaseModal();
                    window.location.reload();
                  } catch (error) {
                    toast.error('Payment verification failed');
                  }
                },
                theme: {
                  color: '#10b981',
                },
                modal: {
                  ondismiss: function () {
                    const payId = res.data.paymentId || res.data.id;
                    if (payId) failMutation.mutate(payId);
                    handleClosePurchaseModal();
                  },
                },
              };

              const paymentObject = new window.Razorpay(options);
              paymentObject.on('payment.failed', function () {
                const payId = res.data.paymentId || res.data.id;
                if (payId) failMutation.mutate(payId);
                toast.error('Payment failed.');
                handleClosePurchaseModal();
              });
              paymentObject.open();
            } else {
              handleClosePurchaseModal();
            }
          }
        }
      );
    }
  };

  const handleRetryPayment = async (paymentId) => {
    retryMutation.mutate(paymentId, {
      onSuccess: async (res) => {
        if (res.data?.razorpayOrderId && res.data?.key_id) {
          const resLoad = await loadRazorpay();
          if (!resLoad) {
            toast.error('Failed to load Razorpay SDK. Are you online?');
            return;
          }

          const targetPayId = res.data.payment?.id || res.data.paymentId || paymentId;

          const options = {
            key: res.data.key_id,
            amount: res.data.amount,
            currency: 'INR',
            name: 'Gym Management',
            description: `Retry Payment`,
            order_id: res.data.razorpayOrderId,
            handler: async function (response) {
              try {
                await verifyPayment({
                  paymentId: targetPayId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                });
                toast.success('Payment verified successfully!');
                window.location.reload();
              } catch (error) {
                toast.error('Payment verification failed');
              }
            },
            theme: { color: '#10b981' },
            modal: {
              ondismiss: function () {
                if (targetPayId) failMutation.mutate(targetPayId);
              },
            },
          };

          const paymentObject = new window.Razorpay(options);
          paymentObject.on('payment.failed', function () {
            if (targetPayId) failMutation.mutate(targetPayId);
            toast.error('Payment failed.');
          });
          paymentObject.open();
        }
      }
    });
  };

  const handleClosePurchaseModal = () => {
    setPurchaseModalOpen(false);
    setSelectedPlanToPurchase(null);
    setCouponInput('');
    setAppliedCoupon(null);
  };

  const activeSub = subscriptions.find((s) => s.status === 'ACTIVE' || s.status === 'FROZEN') || subscriptions[0];
  const payments = paymentData?.payments || [];
  const paymentPagination = paymentData?.pagination || { page: 1, total: payments.length, totalPages: 1 };

  const payStartItem = payments.length > 0 ? (paymentPagination.page - 1) * paymentLimit + 1 : 0;
  const payEndItem = Math.min(paymentPagination.page * paymentLimit, paymentPagination.total);

  const handleCopyReferral = () => {
    if (!referralData?.shareUrl) return;
    navigator.clipboard.writeText(referralData.shareUrl);
    setCopied(true);
    toast.success('Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFreezeSubmit = (e) => {
    e.preventDefault();
    if (!selectedMembership?.id) return;
    freezeMutation.mutate(
      { membershipId: selectedMembership.id, durationDays: parseInt(freezeDays), reason: freezeReason },
      { onSuccess: () => setFreezeModalOpen(false) }
    );
  };

  const handleUnfreeze = (id) => {
    if (confirm('Resume your membership ahead of schedule?')) {
      unfreezeMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Membership & Billing</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your subscription plans, pause membership, view payment history, and earn referral rewards.
          </p>
        </div>
        <Button onClick={() => setPurchaseModalOpen(true)} icon={CreditCard}>
          Purchase Plan
        </Button>
      </div>

      {/* ── Active Plan Card ── */}
      {subsLoading ? (
        <Card><div className="h-32 bg-slate-100 rounded-lg animate-pulse" /></Card>
      ) : activeSub ? (
        <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Current Membership</p>
                <h2 className="text-xl font-extrabold text-white">{activeSub.plan?.name || 'Active Subscription'}</h2>
              </div>
            </div>
            <Badge variant={activeSub.status === 'ACTIVE' ? 'success' : activeSub.status === 'FROZEN' ? 'warning' : 'neutral'}>
              {activeSub.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5">
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Price</p>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">{formatCurrency(activeSub.plan?.price || 0)}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Start Date</p>
              <p className="text-sm font-semibold text-slate-200 mt-1">{formatDate(activeSub.startDate)}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Expiry Date</p>
              <p className="text-sm font-semibold text-slate-200 mt-1">{formatDate(activeSub.endDate)}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Auto Renewal</p>
              <p className="text-sm font-semibold text-slate-200 mt-1">Enabled</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-300">
              {activeSub.status === 'FROZEN'
                ? 'Your subscription is currently paused.'
                : 'Pause subscription up to 28 days during travel or recovery.'}
            </span>
            {activeSub.status === 'FROZEN' ? (
              <Button
                size="sm"
                onClick={() => handleUnfreeze(activeSub.id)}
                loading={unfreezeMutation.isPending}
                icon={Play}
                className="!py-1.5 !px-3"
              >
                Unfreeze Now
              </Button>
            ) : activeSub.status === 'ACTIVE' ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedMembership(activeSub);
                  setFreezeModalOpen(true);
                }}
                icon={Pause}
                className="!py-1.5 !px-3 !bg-slate-800 !text-white !border-slate-700 hover:!bg-slate-700"
              >
                Pause Membership
              </Button>
            ) : null}
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center text-slate-400 text-sm">
          No active membership found. Contact administration to join a plan.
        </Card>
      )}

      {/* ── Referral Program Widget ── */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
              <Gift className="w-5 h-5 text-emerald-600" /> Refer a Friend & Get Free Days!
            </div>
            <p className="text-xs text-slate-600">
              Share your unique referral link with friends. When they sign up, both of you earn extra membership days!
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-emerald-200 shadow-sm">
            <input
              type="text"
              readOnly
              value={referralData?.shareUrl || 'Loading referral link...'}
              className="text-xs text-slate-700 bg-transparent outline-none px-2 font-mono min-w-[220px]"
            />
            <Button size="sm" onClick={handleCopyReferral} icon={copied ? Check : Copy} className="!py-1.5 !px-3 text-xs">
              {copied ? 'Copied' : 'Copy Link'}
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Payment History Table ── */}
      <Card>
        <CardHeader
          title="Payment & Billing History"
          subtitle="View invoices and past transactions"
        />
        {paymentsLoading ? (
          <SkeletonTable rows={4} columns={5} />
        ) : payments.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">No payment records found.</div>
        ) : (
          <>
            {/* Mobile Card List View (< md screens) */}
            <div className="block md:hidden divide-y divide-slate-100 bg-white">
              {payments.map((p) => (
                <div key={p.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <p className="font-mono text-xs font-bold text-slate-900">
                        #{p.invoiceNumber || p.id?.slice(-8)?.toUpperCase()}
                      </p>
                      <p className="text-[11px] text-slate-400">{formatDate(p.paidAt || p.createdAt)}</p>
                    </div>
                    <Badge variant={p.status === 'SUCCESS' || p.status === 'COMPLETED' ? 'success' : p.status === 'FAILED' ? 'danger' : 'warning'}>
                      {p.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Amount</span>
                      <span className="font-bold text-slate-900 text-sm">{formatCurrency(p.amount)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Method</span>
                      <span className="font-medium text-slate-700">{p.paymentMethod || p.gateway || 'ONLINE'}</span>
                    </div>
                  </div>

                  {(p.status === 'SUCCESS' || p.status === 'COMPLETED') && (
                    <div className="flex justify-end pt-2 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant="outline"
                        className="!py-1 !px-3 text-xs text-emerald-700 hover:text-emerald-800 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50"
                        onClick={() => handleDownloadInvoice(p.id)}
                        loading={downloadingInvoiceId === p.id}
                        icon={Receipt}
                      >
                        Download Invoice
                      </Button>
                    </div>
                  )}
                  {p.status === 'FAILED' && p.paymentMethod === 'ONLINE' && (
                    <div className="flex justify-end pt-2 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant="outline"
                        className="!py-1 !px-3 text-xs"
                        onClick={() => handleRetryPayment(p.id)}
                        loading={retryMutation.isPending}
                      >
                        Retry Payment
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= md screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Invoice ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Method</th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors text-xs">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        #{p.invoiceNumber || p.id?.slice(-8)?.toUpperCase()}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(p.paidAt || p.createdAt)}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{formatCurrency(p.amount)}</td>
                      <td className="py-3 px-4 text-slate-600">{p.paymentMethod || p.gateway || 'ONLINE'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={p.status === 'SUCCESS' || p.status === 'COMPLETED' ? 'success' : p.status === 'FAILED' ? 'danger' : 'warning'}>
                            {p.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(p.status === 'SUCCESS' || p.status === 'COMPLETED') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="!py-1 !px-2.5 text-xs text-emerald-700 hover:text-emerald-800 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50"
                            onClick={() => handleDownloadInvoice(p.id)}
                            loading={downloadingInvoiceId === p.id}
                            icon={Receipt}
                          >
                            Invoice
                          </Button>
                        )}
                        {p.status === 'FAILED' && p.paymentMethod === 'ONLINE' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="!py-1 !px-2 text-[10px]"
                            onClick={() => handleRetryPayment(p.id)}
                            loading={retryMutation.isPending}
                          >
                            Retry
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Pagination Bar ── */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50 mt-2">
              <p className="text-xs text-slate-500 font-medium">
                Showing {payStartItem}–{payEndItem} of {paymentPagination.total} payments
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPaymentPage((p) => Math.max(1, p - 1))}
                  disabled={paymentPagination.page <= 1}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-slate-700 px-2">
                  Page {paymentPagination.page} of {paymentPagination.totalPages || 1}
                </span>
                <button
                  onClick={() => setPaymentPage((p) => Math.min(paymentPagination.totalPages || 1, p + 1))}
                  disabled={paymentPagination.page >= (paymentPagination.totalPages || 1)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* ── Pause Membership Modal ── */}
      {freezeModalOpen && (
        <Modal open={freezeModalOpen} onClose={() => setFreezeModalOpen(false)} title="Pause Active Membership">
          <form onSubmit={handleFreezeSubmit} className="space-y-4 text-sm">
            <p className="text-xs text-slate-600">
              Select how long you wish to freeze your subscription. Your expiration date will automatically extend.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pause Duration *</label>
              <select
                value={freezeDays}
                onChange={(e) => setFreezeDays(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                required
              >
                <option value={7}>7 Days (1 Week)</option>
                <option value={14}>14 Days (2 Weeks)</option>
                <option value={21}>21 Days (3 Weeks)</option>
                <option value={28}>28 Days (4 Weeks)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Pause</label>
              <input
                type="text"
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                placeholder="e.g. Travel, Illness, Vacation"
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setFreezeModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={freezeMutation.isPending} icon={Pause}>Confirm Pause</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Purchase Plan Modal ── */}
      {purchaseModalOpen && (
        <Modal open={purchaseModalOpen} onClose={handleClosePurchaseModal} title={selectedPlanToPurchase ? "Select Payment Method" : "Available Membership Plans"}>
          <div className="max-h-[70vh] overflow-y-auto space-y-4 p-1">
            {!selectedPlanToPurchase ? (
              // Step 1: Select Plan
              plansLoading ? (
                <div className="space-y-4">
                  <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                  <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                </div>
              ) : availablePlans.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No plans available at the moment.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availablePlans.map((plan) => (
                    <Card key={plan.id} className="p-5 border border-slate-200 hover:border-emerald-500 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-900 text-lg">{plan.name}</h3>
                        <Badge variant="info">
                          {Math.round((plan.durationInDays || plan.durationMonths * 30) / 30)} Month{Math.round((plan.durationInDays || plan.durationMonths * 30) / 30) !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="text-2xl font-extrabold text-slate-800 mb-2">
                        {formatCurrency(plan.price)}
                      </div>
                      {plan.providedTrainerType && (
                        <Badge variant={plan.providedTrainerType === 'PERSONAL' ? 'purple' : 'slate'} className="mb-4">
                          {plan.providedTrainerType === 'PERSONAL' ? 'Personal Trainer' : 'Common Trainer'}
                        </Badge>
                      )}
                      <p className="text-xs text-slate-500 mb-4 h-8 line-clamp-2">{plan.description}</p>
                      <Button
                        className="w-full"
                        onClick={() => handlePurchaseClick(plan)}
                      >
                        Select Plan
                      </Button>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              // Step 2: Payment Method & Coupon
              <div className="space-y-5">
                {/* Plan Summary & Price Breakdown Card */}
                <Card className="p-4 bg-slate-50 border border-slate-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900">{selectedPlanToPurchase.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Duration: {selectedPlanToPurchase.durationMonths} Months
                      </p>
                    </div>
                    <Badge variant="info">{formatCurrency(selectedPlanToPurchase.price)}</Badge>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Original Price:</span>
                      <span>{formatCurrency(selectedPlanToPurchase.price)}</span>
                    </div>

                    {appliedCoupon && appliedCoupon.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Coupon Discount ({appliedCoupon.code}):</span>
                        <span>-{formatCurrency(appliedCoupon.discountAmount)}</span>
                      </div>
                    )}

                    {appliedCoupon && appliedCoupon.extraDays > 0 && (
                      <div className="flex justify-between text-purple-600 font-semibold">
                        <span>Extra Days Bonus:</span>
                        <span>+{appliedCoupon.extraDays} Days</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total Net Payable:</span>
                      <span className="text-emerald-600">
                        {formatCurrency(appliedCoupon ? appliedCoupon.finalAmount : selectedPlanToPurchase.price)}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* ── Coupon Code Input ── */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Apply Coupon Code</label>
                  {!appliedCoupon ? (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="ENTER COUPON CODE"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg uppercase focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                      </div>
                      <Button
                        type="submit"
                        size="sm"
                        loading={validateCouponMutation.isPending}
                        disabled={!couponInput.trim()}
                        className="!py-2 !px-4 text-xs"
                      >
                        Apply
                      </Button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="font-bold text-emerald-900 font-mono">{appliedCoupon.code}</span>
                          <p className="text-[11px] text-emerald-700">
                            {appliedCoupon.discountType === 'PERCENTAGE' && `${appliedCoupon.discountValue}% discount applied!`}
                            {appliedCoupon.discountType === 'FIXED_AMOUNT' && `${formatCurrency(appliedCoupon.discountAmount)} discount applied!`}
                            {appliedCoupon.discountType === 'FREE_DAYS' && `+${appliedCoupon.extraDays} Free membership days added!`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                        title="Remove Coupon"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Payment Method Options */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Choose Payment Method</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('ONLINE')}
                      className={`p-3.5 border-2 rounded-xl text-left transition-all ${
                        paymentMethod === 'ONLINE' ? 'border-emerald-500 bg-emerald-50/60' : 'border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="font-bold text-slate-800 text-xs">Online Payment</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Pay via Gateway / UPI</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`p-3.5 border-2 rounded-xl text-left transition-all ${
                        paymentMethod === 'CASH' ? 'border-emerald-500 bg-emerald-50/60' : 'border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="font-bold text-slate-800 text-xs">Cash Payment</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Pay at Front Desk</div>
                    </button>
                  </div>
                </div>

                {paymentMethod === 'CASH' && (
                  <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs flex items-start gap-2 border border-amber-200">
                    <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
                    <p>Cash payments require administrator approval. Your membership will be marked as PENDING until verified.</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setSelectedPlanToPurchase(null)}>
                    Back
                  </Button>
                  <Button
                    loading={purchaseMutation.isPending}
                    onClick={submitPurchase}
                    icon={paymentMethod === 'CASH' ? Check : CreditCard}
                  >
                    {paymentMethod === 'CASH'
                      ? 'Request Membership'
                      : `Pay ${formatCurrency(appliedCoupon ? appliedCoupon.finalAmount : selectedPlanToPurchase.price)}`}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}