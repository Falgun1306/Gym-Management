import { useState } from 'react';
import {
  useMemberSubscriptions,
  useMemberPayments,
  useMemberReferralLink,
  useFreezeMembership,
  useUnfreezeMembership,
} from '@/hooks/useMemberPortal';
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
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/utils/formatters';
import toast from 'react-hot-toast';

export default function MyMembershipPage() {
  const { data: subscriptions = [], isLoading: subsLoading } = useMemberSubscriptions();
  const { data: paymentData, isLoading: paymentsLoading } = useMemberPayments();
  const { data: referralData } = useMemberReferralLink();

  const [copied, setCopied] = useState(false);
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [freezeDays, setFreezeDays] = useState(7);
  const [freezeReason, setFreezeReason] = useState('');

  const freezeMutation = useFreezeMembership();
  const unfreezeMutation = useUnfreezeMembership();

  const activeSub = subscriptions.find((s) => s.status === 'ACTIVE' || s.status === 'FROZEN') || subscriptions[0];
  const payments = paymentData?.payments || [];

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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Membership & Billing</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your subscription plans, pause membership, view payment history, and earn referral rewards.
        </p>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Invoice ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Method</th>
                  <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors text-xs">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      #{p.invoiceNumber || p.id?.slice(-8)?.toUpperCase()}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(p.createdAt)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatCurrency(p.amount)}</td>
                    <td className="py-3 px-4 text-slate-600">{p.gateway || 'CARD / UPI'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={p.status === 'COMPLETED' ? 'success' : p.status === 'FAILED' ? 'danger' : 'warning'}>
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </div>
  );
}
