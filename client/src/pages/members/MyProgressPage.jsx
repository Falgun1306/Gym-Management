import { useMemberProgress } from '@/hooks/useMemberPortal';
import { Card, CardHeader, Badge, SkeletonTable } from '@/components/ui';
import {
  Activity,
  Calendar,
  Scale,
  LineChart,
  ClipboardList,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';

export default function MyProgressPage() {
  const { data: progressLogs = [], isLoading } = useMemberProgress();

  const latestLog = progressLogs.length > 0 ? progressLogs[0] : null;
  const previousLog = progressLogs.length > 1 ? progressLogs[1] : null;

  const calculateDiff = (current, prev) => {
    if (current == null || prev == null) return null;
    return (current - prev).toFixed(1);
  };

  const weightDiff = calculateDiff(latestLog?.weight, previousLog?.weight);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Progress & Body Metrics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your weight, measurements, and fitness evolution over time.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="!p-4 bg-gradient-to-br from-white to-slate-50 border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Latest Weight</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {latestLog && latestLog.weight ? `${latestLog.weight} kg` : '—'}
              </p>
              {weightDiff !== null && (
                <div className="flex items-center gap-1 mt-1">
                  {Number(weightDiff) < 0 ? (
                    <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                  ) : Number(weightDiff) > 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Minus className="w-4 h-4 text-slate-400" />
                  )}
                  <span className={`text-xs font-semibold ${Number(weightDiff) < 0 ? 'text-emerald-600' : Number(weightDiff) > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                    {Math.abs(Number(weightDiff))} kg from last log
                  </span>
                </div>
              )}
            </div>
            <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner">
              <Scale className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="!p-4 bg-gradient-to-br from-white to-slate-50 border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Check-Ins</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{progressLogs.length} Entries</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Recorded history</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-purple-50 text-purple-600 shadow-inner">
              <ClipboardList className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="!p-4 bg-gradient-to-br from-white to-slate-50 border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Last Recorded</p>
              <p className="text-xl font-extrabold text-slate-900 mt-1">
                {latestLog && latestLog.recordedAt ? formatDate(latestLog.recordedAt) : 'Never'}
              </p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Keep updating weekly!</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-sky-50 text-sky-600 shadow-inner">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Measurement History" subtitle="Chronological log of your body composition and trainer feedback" icon={LineChart} />
        <div className="p-6 pt-0">
          {isLoading ? (
            <SkeletonTable />
          ) : progressLogs.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No progress logs recorded yet</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                Your assigned trainer will log your body metrics and fitness progress here during your assessments.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-4 rounded-tl-xl">Date</th>
                    <th className="py-3 px-4">Weight</th>
                    <th className="py-3 px-4">Chest / Waist</th>
                    <th className="py-3 px-4">Arms / Thighs</th>
                    <th className="py-3 px-4 rounded-tr-xl">Notes & Observations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {progressLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        {formatDate(log.recordedAt)}
                      </td>
                      <td className="py-4 px-4">
                        {log.weight != null ? (
                          <Badge variant="success" className="font-semibold text-xs px-2.5 py-1">
                            {log.weight} kg
                          </Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-600">
                        <div><span className="text-slate-400">Chest:</span> {log.chest != null ? `${log.chest} inches` : '—'}</div>
                        <div><span className="text-slate-400">Waist:</span> {log.waist != null ? `${log.waist} inches` : '—'}</div>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-600">
                        <div><span className="text-slate-400">Arms:</span> {log.arms != null ? `${log.arms} inches` : '—'}</div>
                        <div><span className="text-slate-400">Thighs:</span> {log.thigh != null ? `${log.thigh} inches` : '—'}</div>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500 max-w-xs truncate">
                        {log.notes ? (
                          <span className="italic text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg block whitespace-normal">
                            "{log.notes}"
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No notes added</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}