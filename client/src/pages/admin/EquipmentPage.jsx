import { useState } from 'react';
import { useEquipment, useCreateEquipment, useUpdateEquipment, useDeleteEquipment } from '@/hooks/useAdmin';
import { Card, Badge, Button, Modal, SkeletonTable } from '@/components/ui';
import { Wrench, Plus, Edit2, Trash2 } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

const CATEGORIES = ['Strength', 'Cardio', 'Free Weights', 'Crossfit', 'Recovery', 'General'];

export default function EquipmentPage() {
  const [createModal, setCreateModal] = useState(false);
  const [editEquipment, setEditEquipment] = useState(null);

  const [form, setForm] = useState({
    name: '',
    category: 'Strength',
    quantity: 1,
    status: 'AVAILABLE',
    maintenanceDate: new Date().toISOString().split('T')[0],
  });

  const { data: equipmentList = [], isLoading } = useEquipment();
  const createMutation = useCreateEquipment();
  const updateMutation = useUpdateEquipment();
  const deleteMutation = useDeleteEquipment();

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(
      {
        name: form.name.trim(),
        category: form.category,
        quantity: parseInt(form.quantity) || 1,
        status: form.status,
        maintenanceDate: form.maintenanceDate ? new Date(form.maintenanceDate).toISOString() : null,
      },
      {
        onSuccess: () => {
          setCreateModal(false);
          setForm({ name: '', category: 'Strength', quantity: 1, status: 'AVAILABLE', maintenanceDate: new Date().toISOString().split('T')[0] });
        },
      }
    );
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editEquipment) return;
    updateMutation.mutate(
      {
        id: editEquipment.id,
        data: {
          name: form.name.trim(),
          category: form.category,
          quantity: parseInt(form.quantity) || 1,
          status: form.status,
          maintenanceDate: form.maintenanceDate ? new Date(form.maintenanceDate).toISOString() : null,
        },
      },
      {
        onSuccess: () => setEditEquipment(null),
      }
    );
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to remove this equipment log?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipment Inventory & Maintenance</h1>
          <p className="text-sm text-slate-500 mt-1">Track workout equipment operational status and repairs.</p>
        </div>
        <Button onClick={() => setCreateModal(true)} icon={Plus}>
          Add Equipment
        </Button>
      </div>

      <Card className="!p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={5} columns={6} />
          </div>
        ) : equipmentList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No equipment logged in system.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Equipment Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Last Maintenance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {equipmentList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium text-xs">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                        {item.category || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{item.quantity} units</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{formatDate(item.maintenanceDate || item.lastMaintenanceDate)}</td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          item.status === 'AVAILABLE' || item.status === 'OPERATIONAL'
                            ? 'success'
                            : item.status === 'UNDER_MAINTENANCE'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {item.status?.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditEquipment(item);
                            setForm({
                              name: item.name,
                              category: item.category || 'Strength',
                              quantity: item.quantity,
                              status: item.status || 'AVAILABLE',
                              maintenanceDate: (item.maintenanceDate || item.lastMaintenanceDate)
                                ? new Date(item.maintenanceDate || item.lastMaintenanceDate).toISOString().split('T')[0]
                                : new Date().toISOString().split('T')[0],
                            });
                          }}
                          className="!p-1.5"
                        >
                          <Edit2 className="w-4 h-4 text-slate-600" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="!p-1.5 hover:bg-rose-50">
                          <Trash2 className="w-4 h-4 text-rose-600" />
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

      {/* Add / Edit Equipment Modal */}
      {(createModal || editEquipment) && (
        <Modal
          open={createModal || !!editEquipment}
          onClose={() => { setCreateModal(false); setEditEquipment(null); }}
          title={editEquipment ? 'Update Equipment Details' : 'Add New Equipment'}
        >
          <form onSubmit={editEquipment ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Olympic Barbell 20kg, Cable Crossover Tower"
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Operational Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="AVAILABLE">Available / Operational</option>
                  <option value="IN_USE">In Use</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  <option value="DAMAGED">Damaged</option>
                  <option value="RETIRED">Retired</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Maintenance Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={form.maintenanceDate}
                  onChange={(e) => setForm({ ...form, maintenanceDate: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setCreateModal(false); setEditEquipment(null); }}>
                Cancel
              </Button>
              <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                {editEquipment ? 'Save Changes' : 'Add Item'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
