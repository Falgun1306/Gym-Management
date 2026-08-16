import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  toggleAdminCouponStatus,
  getAdminCouponUsages,
  listMembershipPlans,
} from '@/services/adminService';
import { Card, CardHeader, Badge, Button, Modal, SkeletonTable } from '@/components/ui';
import {
  Ticket,
  Plus,
  Search,
  Filter,
  Calendar,
  Percent,
  DollarSign,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  Eye,
  Power,
  Copy,
  Check,
  Tag,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/utils/formatters';
import toast from 'react-hot-toast';

export default function CouponsPage() {
  const queryClient = useQueryClient();

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [usageModalOpen, setUsageModalOpen] = useState(false);
  const [usageCoupon, setUsageCoupon] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minPurchaseAmount: '',
    maxDiscountAmount: '',
    maxUsageCount: '',
    perUserLimit: 1,
    startDate: new Date().toISOString().split('T')[0],
    expiresAt: '',
    applicablePlanIds: [],
  });

  const [copiedCode, setCopiedCode] = useState(null);

  // Fetch Coupons
  const { data: couponsRes, isLoading: couponsLoading } = useQuery({
    queryKey: ['admin', 'coupons', { page, status: statusFilter, type: typeFilter }],
    queryFn: () => listAdminCoupons({ page, limit: 20, status: statusFilter, type: typeFilter }),
    staleTime: 15_000,
  });

  // Fetch Active Membership Plans (for applicable plans selection)
  const { data: plansRes } = useQuery({
    queryKey: ['admin', 'membership-plans'],
    queryFn: () => listMembershipPlans(),
    staleTime: 60_000,
  });

  // Fetch Coupon Usages when usageModalOpen is true
  const { data: usagesRes, isLoading: usagesLoading } = useQuery({
    queryKey: ['admin', 'coupon-usages', usageCoupon?.id],
    queryFn: () => getAdminCouponUsages(usageCoupon?.id),
    enabled: !!usageCoupon?.id && usageModalOpen,
  });

  const coupons = Array.isArray(couponsRes) ? couponsRes : (Array.isArray(couponsRes?.data) ? couponsRes.data : []);
  const pagination = couponsRes?.pagination || { page: 1, totalPages: 1, total: 0 };
  const plans = Array.isArray(plansRes) ? plansRes : (Array.isArray(plansRes?.data) ? plansRes.data : []);
  const usages = Array.isArray(usagesRes) ? usagesRes : (Array.isArray(usagesRes?.data) ? usagesRes.data : []);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createAdminCoupon,
    onSuccess: () => {
      toast.success('Coupon created successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      handleCloseModals();
    },
    onError: (err) => toast.error(err.message || 'Failed to create coupon'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateAdminCoupon(id, data),
    onSuccess: () => {
      toast.success('Coupon updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      handleCloseModals();
    },
    onError: (err) => toast.error(err.message || 'Failed to update coupon'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: toggleAdminCouponStatus,
    onSuccess: (res) => {
      toast.success(res.message || 'Coupon status updated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to toggle status'),
  });

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied ${code} to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenCreateModal = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      minPurchaseAmount: '',
      maxDiscountAmount: '',
      maxUsageCount: '',
      perUserLimit: 1,
      startDate: new Date().toISOString().split('T')[0],
      expiresAt: '',
      applicablePlanIds: [],
    });
    setCreateModalOpen(true);
  };

  const handleOpenEditModal = (coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchaseAmount: coupon.minPurchaseAmount || '',
      maxDiscountAmount: coupon.maxDiscountAmount || '',
      maxUsageCount: coupon.maxUsageCount || '',
      perUserLimit: coupon.perUserLimit || 1,
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
      applicablePlanIds: coupon.applicablePlanIds || [],
    });
    setEditModalOpen(true);
  };

  const handleOpenUsageModal = (coupon) => {
    setUsageCoupon(coupon);
    setUsageModalOpen(true);
  };

  const handleCloseModals = () => {
    setCreateModalOpen(false);
    setEditModalOpen(false);
    setUsageModalOpen(false);
    setSelectedCoupon(null);
    setUsageCoupon(null);
  };

  const handlePlanToggle = (planId) => {
    setFormData((prev) => {
      const exists = prev.applicablePlanIds.includes(planId);
      if (exists) {
        return { ...prev, applicablePlanIds: prev.applicablePlanIds.filter((id) => id !== planId) };
      } else {
        return { ...prev, applicablePlanIds: [...prev.applicablePlanIds, planId] };
      }
    });
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      code: formData.code,
      description: formData.description,
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue),
      minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : null,
      maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
      maxUsageCount: formData.maxUsageCount ? parseInt(formData.maxUsageCount) : null,
      perUserLimit: parseInt(formData.perUserLimit) || 1,
      startDate: formData.startDate || undefined,
      expiresAt: formData.expiresAt || null,
      applicablePlanIds: formData.applicablePlanIds,
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedCoupon) return;
    updateMutation.mutate({
      id: selectedCoupon.id,
      data: {
        description: formData.description,
        minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : null,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        maxUsageCount: formData.maxUsageCount ? parseInt(formData.maxUsageCount) : null,
        perUserLimit: parseInt(formData.perUserLimit) || 1,
        startDate: formData.startDate || undefined,
        expiresAt: formData.expiresAt || null,
        applicablePlanIds: formData.applicablePlanIds,
      },
    });
  };

  // Filtered coupons search
  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Metrics summary
  const activeCount = coupons.filter((c) => c.status === 'ACTIVE').length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Ticket className="w-7 h-7 text-emerald-600" /> Coupon & Discount Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create discount codes, set usage limits & plan restrictions, and monitor member usage history.
          </p>
        </div>
        <Button onClick={handleOpenCreateModal} icon={Plus}>
          Create Coupon
        </Button>
      </div>

      {/* ── Metrics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-emerald-500 bg-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Total Coupons</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{pagination.total || coupons.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-blue-500 bg-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Active Status</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{activeCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-purple-500 bg-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Total Redemptions</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalRedemptions}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-amber-500 bg-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Discount Types</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">3 Types</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* ── Filters & Search ── */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search coupon code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All Types</option>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
              <option value="FREE_DAYS">Free Days</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ── Coupon List ── */}
      <Card>
        {couponsLoading ? (
          <SkeletonTable rows={5} columns={7} />
        ) : filteredCoupons.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            No coupons found matching your criteria.
          </div>
        ) : (
          <>
            {/* Mobile Card List View (< md screens) */}
            <div className="block md:hidden divide-y divide-slate-100 bg-white">
              {filteredCoupons.map((coupon) => {
                const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                const effectiveStatus = isExpired ? 'EXPIRED' : coupon.status;

                return (
                  <div key={coupon.id} className="p-4 space-y-3">
                    {/* Header: Code + Copy + Status */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-mono text-xs font-bold">
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(coupon.code)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded"
                          title="Copy Code"
                        >
                          {copiedCode === coupon.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <Badge
                        variant={
                          effectiveStatus === 'ACTIVE'
                            ? 'success'
                            : effectiveStatus === 'EXPIRED'
                            ? 'danger'
                            : 'neutral'
                        }
                      >
                        {effectiveStatus}
                      </Badge>
                    </div>

                    {/* Discount & Usage */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Discount</p>
                        <p className="text-base font-extrabold text-slate-900">
                          {coupon.discountType === 'PERCENTAGE' && `${coupon.discountValue}%`}
                          {coupon.discountType === 'FIXED_AMOUNT' && formatCurrency(coupon.discountValue)}
                          {coupon.discountType === 'FREE_DAYS' && `+${coupon.discountValue} Days`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Usage</p>
                        <p className="text-sm font-bold text-slate-800">
                          {coupon.usageCount} / {coupon.maxUsageCount || '∞'}
                        </p>
                      </div>
                    </div>

                    {/* Limits & Expiry */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase">Limits</span>
                        <span className="text-slate-700 font-medium">Min: {coupon.minPurchaseAmount ? formatCurrency(coupon.minPurchaseAmount) : 'None'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase">Expiry</span>
                        <span className="text-slate-700 font-medium">{coupon.expiresAt ? formatDate(coupon.expiresAt) : 'Never'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenUsageModal(coupon)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg"
                        title="View Redemptions"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(coupon)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg"
                        title="Edit Coupon"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleStatusMutation.mutate(coupon.id)}
                        className={`p-1.5 rounded-lg ${
                          coupon.status === 'ACTIVE' ? 'text-emerald-600 hover:text-red-600' : 'text-slate-400 hover:text-emerald-600'
                        }`}
                        title="Toggle Status"
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= md screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Code</th>
                    <th className="py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Discount</th>
                    <th className="py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Limits & Rules</th>
                    <th className="py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Applicable Plans</th>
                    <th className="py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Usage</th>
                    <th className="py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Expiry</th>
                    <th className="py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Status</th>
                    <th className="py-3 px-4 font-semibold text-[11px] uppercase text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCoupons.map((coupon) => {
                    const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                    const effectiveStatus = isExpired ? 'EXPIRED' : coupon.status;

                    return (
                      <tr key={coupon.id} className="hover:bg-slate-50/80 transition-colors text-xs">
                        {/* Code */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-mono text-xs">
                              {coupon.code}
                            </span>
                            <button
                              onClick={() => handleCopyCode(coupon.code)}
                              title="Copy code"
                              className="p-1 text-slate-400 hover:text-slate-600 rounded"
                            >
                              {copiedCode === coupon.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          {coupon.description && <p className="text-[11px] text-slate-500 font-normal mt-0.5 line-clamp-1">{coupon.description}</p>}
                        </td>

                        {/* Discount Value */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800">
                            {coupon.discountType === 'PERCENTAGE' && `${coupon.discountValue}% OFF`}
                            {coupon.discountType === 'FIXED_AMOUNT' && formatCurrency(coupon.discountValue)}
                            {coupon.discountType === 'FREE_DAYS' && `+${coupon.discountValue} Extra Days`}
                          </span>
                          {coupon.maxDiscountAmount && (
                            <p className="text-[10px] text-slate-500 mt-0.5">Cap: {formatCurrency(coupon.maxDiscountAmount)}</p>
                          )}
                        </td>

                        {/* Limits & Rules */}
                        <td className="py-3.5 px-4 text-slate-600">
                          <div>Min Order: {coupon.minPurchaseAmount ? formatCurrency(coupon.minPurchaseAmount) : 'None'}</div>
                          <div className="text-[10px] text-slate-500">Per Member: {coupon.perUserLimit} use(s)</div>
                        </td>

                        {/* Applicable Plans */}
                        <td className="py-3.5 px-4">
                          {!coupon.applicablePlanIds || coupon.applicablePlanIds.length === 0 ? (
                            <Badge variant="neutral">All Plans</Badge>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                              {coupon.applicablePlanIds.map((pId) => {
                                const plan = plans.find((p) => p.id === pId);
                                return (
                                  <span key={pId} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] truncate">
                                    {plan ? plan.name : 'Plan'}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        {/* Usage */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">
                            {coupon.usageCount} {coupon.maxUsageCount ? `/ ${coupon.maxUsageCount}` : 'uses'}
                          </div>
                        </td>

                        {/* Expiry */}
                        <td className="py-3.5 px-4 text-slate-600">
                          {coupon.expiresAt ? formatDate(coupon.expiresAt) : 'Never'}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              effectiveStatus === 'ACTIVE'
                                ? 'success'
                                : effectiveStatus === 'EXPIRED'
                                ? 'danger'
                                : 'neutral'
                            }
                          >
                            {effectiveStatus}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenUsageModal(coupon)}
                              title="View Redemptions"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(coupon)}
                              title="Edit Coupon"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => toggleStatusMutation.mutate(coupon.id)}
                              title={coupon.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                coupon.status === 'ACTIVE'
                                  ? 'text-emerald-600 hover:text-red-600 hover:bg-red-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* ── Create Coupon Modal ── */}
      {createModalOpen && (
        <Modal open={createModalOpen} onClose={handleCloseModals} title="Create New Coupon Code">
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER2026"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full text-sm font-mono border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Type *</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                  <option value="FREE_DAYS">Free Membership Days</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <input
                type="text"
                placeholder="e.g. Special summer promotional discount"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discount Value * {formData.discountType === 'PERCENTAGE' ? '(%)' : formData.discountType === 'FIXED_AMOUNT' ? '(₹)' : '(Days)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.1"
                  placeholder={formData.discountType === 'PERCENTAGE' ? '20' : '500'}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Min Purchase (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  value={formData.minPurchaseAmount}
                  onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Discount Cap (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  disabled={formData.discountType !== 'PERCENTAGE'}
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Usage Cap (All Users)</label>
                <input
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={formData.maxUsageCount}
                  onChange={(e) => setFormData({ ...formData, maxUsageCount: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Per-Member Usage Limit *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.perUserLimit}
                  onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Applicable Membership Plans Multi-Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Applicable Membership Plans (Default: All Plans)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {plans.map((plan) => {
                  const isChecked = formData.applicablePlanIds.includes(plan.id);
                  return (
                    <label key={plan.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handlePlanToggle(plan.id)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="truncate">{plan.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={handleCloseModals}>
                Cancel
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                Create Coupon
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Coupon Modal ── */}
      {editModalOpen && selectedCoupon && (
        <Modal open={editModalOpen} onClose={handleCloseModals} title={`Edit Coupon (${selectedCoupon.code})`}>
          <form onSubmit={handleEditSubmit} className="space-y-4 text-sm max-h-[75vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Min Purchase (₹)</label>
                <input
                  type="number"
                  value={formData.minPurchaseAmount}
                  onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Discount Cap (₹)</label>
                <input
                  type="number"
                  disabled={selectedCoupon.discountType !== 'PERCENTAGE'}
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Usage Cap</label>
                <input
                  type="number"
                  value={formData.maxUsageCount}
                  onChange={(e) => setFormData({ ...formData, maxUsageCount: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Per-Member Limit</label>
                <input
                  type="number"
                  value={formData.perUserLimit}
                  onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Applicable Membership Plans */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Applicable Membership Plans</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {plans.map((plan) => {
                  const isChecked = formData.applicablePlanIds.includes(plan.id);
                  return (
                    <label key={plan.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handlePlanToggle(plan.id)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="truncate">{plan.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={handleCloseModals}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Coupon Usage History Modal ── */}
      {usageModalOpen && usageCoupon && (
        <Modal open={usageModalOpen} onClose={handleCloseModals} title={`Usage History — ${usageCoupon.code}`}>
          <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto">
            {usagesLoading ? (
              <SkeletonTable rows={3} columns={4} />
            ) : usages.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No redemptions recorded yet for this coupon.</div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold text-[11px] uppercase text-slate-500">Member</th>
                    <th className="py-2.5 px-3 font-semibold text-[11px] uppercase text-slate-500">Plan</th>
                    <th className="py-2.5 px-3 font-semibold text-[11px] uppercase text-slate-500">Discount Saved</th>
                    <th className="py-2.5 px-3 font-semibold text-[11px] uppercase text-slate-500">Date Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usages.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {u.member ? `${u.member.firstName} ${u.member.lastName}` : 'Member'}
                        {u.member?.user?.email && <p className="text-[10px] text-slate-400 font-normal">{u.member.user.email}</p>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {u.membership?.plan?.name || 'Subscription'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-600">
                        {u.discountApplied > 0 ? formatCurrency(u.discountApplied) : `+${u.extraDaysGranted} Days`}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {formatDate(u.usedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
