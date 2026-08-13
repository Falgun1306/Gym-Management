import { useState } from 'react';
import { useAdminPayments, useCreateAdminPayment, useApprovePayment } from '@/hooks/useAdmin';
import { useMembers } from '@/hooks/useMembers';
import { Card, Badge, Button, Modal, SkeletonTable } from '@/components/ui';
import { CreditCard, FileText, Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [recordPaymentModal, setRecordPaymentModal] = useState(false);

  const [form, setForm] = useState({
    username: '',
    amount: '',
    paymentMethod: 'CASH',
    description: 'Manual facility payment',
  });

  const { data: membersRes } = useMembers({ limit: 100 });
  const memberList = membersRes?.members || (Array.isArray(membersRes) ? membersRes : []);

  const { data, isLoading } = useAdminPayments({ status: statusFilter || undefined });
  const payments = data?.payments || [];
  const createPaymentMutation = useCreateAdminPayment();
  const approvePaymentMutation = useApprovePayment();

  const handleApprove = (paymentId) => {
    if (confirm('Approve this pending payment and activate the membership?')) {
      approvePaymentMutation.mutate(paymentId);
    }
  };

  const handleRecordSubmit = (e) => {
    e.preventDefault();
    createPaymentMutation.mutate(
      {
        username: form.username,
        amount: parseFloat(form.amount) || 0,
        paymentMethod: form.paymentMethod,
        description: form.description,
      },
      {
        onSuccess: () => {
          setRecordPaymentModal(false);
          setForm({ username: '', amount: '', paymentMethod: 'CASH', description: 'Manual facility payment' });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments & Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">Audit facility billing transactions and payment status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setRecordPaymentModal(true)} icon={Plus}>
            Record Payment
          </Button>
          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            {['', 'SUCCESS', 'PENDING', 'FAILED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st || 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={6} columns={5} />
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No payment records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method / Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                      {p.id.slice(0, 8).toUpperCase()}...
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {p.member ? `${p.member.firstName} ${p.member.lastName}` : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{formatCurrency(p.amount)}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      <p className="font-medium text-slate-700 capitalize">{p.paymentMethod || 'Online'}</p>
                      <p>{formatDate(p.paidAt || p.createdAt)}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          p.status === 'SUCCESS' ? 'success' : p.status === 'PENDING' ? 'warning' : 'danger'
                        }
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {p.status === 'PENDING' && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleApprove(p.id)}
                            loading={approvePaymentMutation.isPending && approvePaymentMutation.variables === p.id}
                            className="!px-2 !py-1 text-xs"
                          >
                            Approve
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedInvoice(p)}
                          className="!p-1.5"
                        >
                          <FileText className="w-4 h-4 text-slate-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Record Manual Payment Modal */}
      {recordPaymentModal && (
        <Modal open={recordPaymentModal} onClose={() => setRecordPaymentModal(false)} title="Record Facility Payment">
          <form onSubmit={handleRecordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Member or Enter Username *</label>
              {memberList.length > 0 && (
                <select
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 mb-2 focus:ring-2 focus:ring-emerald-500/20 bg-white"
                >
                  <option value="">Choose from existing members...</option>
                  {memberList.map((m) => {
                    const uName = m.user?.username || m.user?.email || m.firstName;
                    return (
                      <option key={m.id} value={uName}>
                        {m.firstName} {m.lastName} (@{uName})
                      </option>
                    );
                  })}
                </select>
              )}
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Or type exact Member Username"
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="1500"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI / GPay</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="ONLINE">Online Gateway</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Note</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setRecordPaymentModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={createPaymentMutation.isPending} icon={CreditCard}>
                Record Payment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <Modal open={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title="Invoice Receipt Details">
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-semibold text-slate-600">Transaction Ref:</span>
                <span className="font-mono text-xs">{selectedInvoice.id}</span>
              </div>
              <p><strong>Member Name:</strong> {selectedInvoice.member?.firstName} {selectedInvoice.member?.lastName}</p>
              <p><strong>Amount Paid:</strong> <span className="font-bold text-emerald-700">{formatCurrency(selectedInvoice.amount)}</span></p>
              <p><strong>Payment Method:</strong> {selectedInvoice.paymentMethod || 'Razorpay / Gateway'}</p>
              <p><strong>Date & Time:</strong> {formatDate(selectedInvoice.paidAt || selectedInvoice.createdAt)}</p>
              <p><strong>Status:</strong> {selectedInvoice.status}</p>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => window.print()} variant="outline">
                Print Invoice
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
