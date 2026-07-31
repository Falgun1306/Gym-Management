import { useState } from 'react';
import { useAttendanceReport, useRevenueReport } from '@/hooks/useAdmin';
import { Card, CardHeader, StatCard, Button, SkeletonCard } from '@/components/ui';
import { BarChart3, Download, TrendingUp, CalendarCheck, CreditCard } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('30');

  const { data: attendanceData, isLoading: attLoading } = useAttendanceReport({ days: dateRange });
  const { data: revenueData, isLoading: revLoading } = useRevenueReport({ days: dateRange });

  const exportCSV = (data, filename) => {
    if (!data) return;
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Export facility attendance logs and financial revenue summaries.</p>
        </div>
        <div className="flex items-center gap-2">
          {['7', '30', '90'].map((d) => (
            <button
              key={d}
              onClick={() => setDateRange(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                dateRange === d
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Last {d} Days
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {revLoading || attLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              title="Total Revenue (Period)"
              value={revenueData?.totalRevenue != null ? formatCurrency(revenueData.totalRevenue) : '₹0'}
              icon={CreditCard}
              iconBg="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              title="Total Check-ins"
              value={attendanceData?.totalAttendance?.toLocaleString() || '0'}
              icon={CalendarCheck}
              iconBg="bg-blue-50 text-blue-600"
            />
            <StatCard
              title="Avg Daily Attendance"
              value={attendanceData?.avgDaily != null ? Math.round(attendanceData.avgDaily) : '0'}
              icon={TrendingUp}
              iconBg="bg-violet-50 text-violet-600"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader
            title="Attendance Activity Report"
            subtitle={`Logs from past ${dateRange} days`}
            action={
              <Button size="sm" variant="outline" onClick={() => exportCSV(attendanceData, `attendance_report_${dateRange}d`)} icon={Download}>
                Export Data
              </Button>
            }
          />
          <div className="bg-slate-50 rounded-lg p-6 flex flex-col items-center justify-center min-h-[180px] border border-slate-200 text-center">
            <BarChart3 className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Attendance Distribution</p>
            <p className="text-xs text-slate-400 mt-1">Total Records Logged: {attendanceData?.totalAttendance || 0}</p>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Financial Breakdown Report"
            subtitle={`Revenue logs from past ${dateRange} days`}
            action={
              <Button size="sm" variant="outline" onClick={() => exportCSV(revenueData, `revenue_report_${dateRange}d`)} icon={Download}>
                Export Data
              </Button>
            }
          />
          <div className="bg-slate-50 rounded-lg p-6 flex flex-col items-center justify-center min-h-[180px] border border-slate-200 text-center">
            <CreditCard className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Revenue Breakdown</p>
            <p className="text-xs text-slate-400 mt-1">Gross Inflow: {formatCurrency(revenueData?.totalRevenue || 0)}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
