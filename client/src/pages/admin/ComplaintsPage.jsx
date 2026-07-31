import { useState } from 'react';
import { useAdminComplaints, useResolveComplaint } from '@/hooks/useAdmin';
import { Card, Badge, Button, Modal, SkeletonTable } from '@/components/ui';
import { MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

export default function ComplaintsPage() {
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [resolutionText, setResolutionText] = useState('');

  const { data: complaints = [], isLoading } = useAdminComplaints();
  const resolveMutation = useResolveComplaint();

  const handleResolveSubmit = (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    resolveMutation.mutate(
      { id: selectedComplaint.id, resolution: resolutionText },
      {
        onSuccess: () => {
          setSelectedComplaint(null);
          setResolutionText('');
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Complaints & Support Tickets</h1>
        <p className="text-sm text-slate-500 mt-1">Review feedback and respond to member facility concerns.</p>
      </div>

      <Card className="!p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={5} columns={4} />
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No complaints or support tickets found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Submitted By</th>
                  <th className="py-3 px-4">Subject / Issue</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {c.member ? `${c.member.firstName} ${c.member.lastName}` : 'Anonymous Member'}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-slate-800 truncate">{c.title || c.subject || 'Facility Complaint'}</p>
                      <p className="text-xs text-slate-500 truncate">{c.description}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{formatDate(c.createdAt)}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={c.status === 'RESOLVED' ? 'success' : 'warning'}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedComplaint(c);
                          setResolutionText(c.resolution || '');
                        }}
                      >
                        {c.status === 'RESOLVED' ? 'View Ticket' : 'Resolve'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Resolution Modal */}
      {selectedComplaint && (
        <Modal
          open={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={`Ticket #${selectedComplaint.id.slice(0, 6)}`}
        >
          <form onSubmit={handleResolveSubmit} className="space-y-4 text-sm">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <p><strong>Member:</strong> {selectedComplaint.member?.firstName} {selectedComplaint.member?.lastName}</p>
              <p><strong>Complaint Description:</strong></p>
              <p className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200 leading-relaxed">
                {selectedComplaint.description}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution Response</label>
              <textarea
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                placeholder="Provide resolution details or actions taken..."
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 h-24"
                disabled={selectedComplaint.status === 'RESOLVED'}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setSelectedComplaint(null)}>
                Close
              </Button>
              {selectedComplaint.status !== 'RESOLVED' && (
                <Button type="submit" loading={resolveMutation.isPending} icon={CheckCircle}>
                  Mark as Resolved
                </Button>
              )}
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
