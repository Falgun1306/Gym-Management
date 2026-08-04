import { useState } from 'react';
import {
  Plus,
  Download,
  Trash2,
  Settings,
  Users,
  Dumbbell,
  CreditCard,
  TrendingUp,
  Mail,
  Lock,
  Filter,
} from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Select,
  Badge,
  DataTable,
  Modal,
  Sheet,
  ConfirmDialog,
  Card,
  CardHeader,
  StatCard,
  Avatar,
  SkeletonCard,
  SkeletonStat,
} from '@/components/ui';

// ── Mock data for DataTable demo ──
const mockMembers = [
  { id: '1', firstName: 'Arjun', lastName: 'Patel', email: 'arjun@gym.com', status: 'ACTIVE', plan: 'Premium' },
  { id: '2', firstName: 'Priya', lastName: 'Sharma', email: 'priya@gym.com', status: 'PENDING', plan: 'Basic' },
  { id: '3', firstName: 'Rahul', lastName: 'Kumar', email: 'rahul@gym.com', status: 'EXPIRED', plan: 'Pro' },
  { id: '4', firstName: 'Sneha', lastName: 'Reddy', email: 'sneha@gym.com', status: 'ACTIVE', plan: 'Premium' },
  { id: '5', firstName: 'Vikram', lastName: 'Singh', email: 'vikram@gym.com', status: 'FROZEN', plan: 'Basic' },
  { id: '6', firstName: 'Anita', lastName: 'Gupta', email: 'anita@gym.com', status: 'ACTIVE', plan: 'Pro' },
];

const columns = [
  {
    key: 'firstName',
    header: 'Member',
    sortable: true,
    render: (_, row) => (
      <div className="flex items-center gap-3">
        <Avatar firstName={row.firstName} lastName={row.lastName} size="sm" />
        <div>
          <p className="font-medium text-slate-900">{row.firstName} {row.lastName}</p>
          <p className="text-xs text-slate-500">{row.email}</p>
        </div>
      </div>
    ),
  },
  { key: 'plan', header: 'Plan', sortable: true },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (value) => <Badge status={value} dot size="sm" />,
  },
  {
    key: 'actions',
    header: '',
    render: () => (
      <Button variant="ghost" size="sm" icon={Settings}>
        Manage
      </Button>
    ),
  },
];

export default function ComponentShowcase() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-10 max-w-6xl mx-auto">
      {/* Header matching component library.png */}
      <div className="space-y-1 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-emerald-800 tracking-tight">Component Library</h1>
        <p className="text-sm text-slate-500">Design System Reference for IronPulse / IronPeak Management UI.</p>
      </div>

      {/* ── KPI Cards ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">KPI Cards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Members"
            value="1,248"
            icon={Users}
            trend={12}
            trendLabel="this month"
            iconBg="bg-emerald-50 text-emerald-700"
          />
          <StatCard
            title="Active Sessions"
            value="42"
            icon={Dumbbell}
            subtitle="Currently running"
            iconBg="bg-emerald-50 text-emerald-700"
          />
          <StatCard
            title="Monthly Revenue"
            value="₹4,82,300"
            icon={CreditCard}
            trend={8}
            trendLabel="vs last mo"
            iconBg="bg-slate-100 text-slate-700"
          />
          <StatCard
            title="Attendance Rate"
            value="87%"
            icon={TrendingUp}
            subtitle="Last 30 days"
            iconBg="bg-slate-100 text-slate-700"
          />
        </div>
      </section>

      {/* ── Status Badges ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Status Badges</h2>
        <Card className="!p-5">
          <div className="flex flex-wrap items-center gap-3">
            <Badge status="ACTIVE" dot>Active</Badge>
            <Badge status="CANCELLED" dot>Inactive</Badge>
            <Badge status="FROZEN" dot>Frozen</Badge>
            <Badge status="PENDING" dot>Pending</Badge>
            <Badge variant="frozen" dot>Frozen</Badge>
            <Badge variant="maintenance" dot>Maintenance</Badge>
          </div>
        </Card>
      </section>

      {/* ── Buttons ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Buttons</h2>
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <Button icon={Plus}> Add Member</Button>
            <Button variant="outline" icon={Download}>Record Payment</Button>
            <Button variant="secondary">New Plan</Button>
            <Button variant="danger" icon={Trash2}>Revoke Access</Button>
            <Button variant="ghost">Cancel</Button>
            <Button loading>Saving...</Button>
          </div>
        </Card>
      </section>

      {/* ── Search & Filters ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Search & Filters</h2>
        <Card>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:w-80">
              <Input
                placeholder="Search members, classes..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
            <Button variant="outline" icon={Filter} size="md">
              Filter
            </Button>
            <Badge status="ACTIVE" size="md">Status: Active ×</Badge>
          </div>
        </Card>
      </section>

      {/* ── Data Table ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Data Table</h2>
        <Card className="!p-4">
          <CardHeader
            title="Members List"
            subtitle="Manage facility members, memberships, and status."
            action={
              <Button size="sm" icon={Plus}>
                Add Member
              </Button>
            }
          />
          <DataTable
            columns={columns}
            data={mockMembers}
            searchable
            selectable
            searchPlaceholder="Search members..."
            defaultSortKey="firstName"
            defaultPageSize={5}
          />
        </Card>
      </section>

      {/* ── Overlays ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Modals & Dialogs</h2>
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => setModalOpen(true)}>
              Edit Member Profile Modal
            </Button>
            <Button variant="outline" onClick={() => setSheetOpen(true)}>
              View Profile Drawer
            </Button>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              Revoke Membership Dialog
            </Button>
          </div>
        </Card>
      </section>

      {/* ── Skeletons ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Loading Skeletons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonStat />
          <SkeletonCard />
        </div>
      </section>

      {/* ── Modal Instance ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Edit Member Profile"
        description="Update personal information and membership tier."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => setModalOpen(false)}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="First Name" placeholder="Jane" />
          <Input label="Last Name" placeholder="Doe" />
          <Input label="Email Address" type="email" icon={Mail} placeholder="jane.doe@email.com" />
          <Select
            label="Membership Plan"
            options={[
              { value: 'basic', label: 'Basic Monthly' },
              { value: 'pro', label: 'Pro Quarterly' },
              { value: 'premium', label: 'Elite Plus Annual' },
            ]}
          />
        </div>
      </Modal>

      {/* ── Sheet Instance ── */}
      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Member Details"
        description="ID: #MM-8472"
        footer={
          <>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Message</Button>
            <Button onClick={() => setSheetOpen(false)}>Edit Profile</Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Avatar firstName="Jane" lastName="Doe" size="lg" />
            <div>
              <p className="font-semibold text-slate-900">Jane Doe</p>
              <p className="text-xs text-slate-500">Active • ID: #MM-8472</p>
              <Badge status="ACTIVE" dot size="sm" className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Membership</p>
              <p className="font-semibold text-slate-900 mt-0.5">Elite Plus</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Next Billing</p>
              <p className="font-semibold text-slate-900 mt-0.5">Nov 12, 2026</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase">Contact Information</p>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1 text-sm text-slate-700">
              <p>📞 (555) 123-4567</p>
              <p>✉️ jane.doe@email.com</p>
            </div>
          </div>
        </div>
      </Sheet>

      {/* ── Confirm Dialog Instance matching component library.png ── */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => setConfirmOpen(false)}
        title="Revoke Membership?"
        description="This action cannot be undone. This will permanently remove the member's access to the facility and delete their upcoming bookings."
        confirmText="Revoke Access"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
