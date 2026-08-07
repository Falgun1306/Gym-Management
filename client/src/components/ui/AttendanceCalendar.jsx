import { useState, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Minus } from 'lucide-react';

/**
 * AttendanceCalendar — Monthly calendar view for gym attendance.
 *
 * Props:
 *  - attendanceLogs: Array of attendance records with { checkIn, checkOut, date, createdAt }
 *  - membershipStart: ISO date string for membership start (optional, defaults to first log)
 *  - membershipEnd: ISO date string for membership end (optional, defaults to today)
 *  - className: Additional CSS classes
 *
 * Features:
 *  - Month/year navigation with prev/next buttons
 *  - Green checkmark (✓) on days with check-in (present via QR scan or manual)
 *  - Red X on days with no attendance within the membership period
 *  - Greyed out days outside the membership period
 *  - Today is highlighted with a ring
 *  - Summary stats row below the calendar
 */
export default function AttendanceCalendar({
  attendanceLogs = [],
  membershipStart,
  membershipEnd,
  className,
}) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // ── Build a Set of attended date strings (YYYY-MM-DD) for fast lookup ──
  const attendedDates = useMemo(() => {
    const dates = new Set();
    attendanceLogs.forEach((log) => {
      const dateStr = log.checkIn || log.date || log.createdAt;
      if (dateStr) {
        const d = new Date(dateStr);
        dates.add(formatDateKey(d));
      }
    });
    return dates;
  }, [attendanceLogs]);

  // ── Membership boundaries ──
  const mStart = membershipStart ? new Date(membershipStart) : null;
  const mEnd = membershipEnd ? new Date(membershipEnd) : null;

  // ── Calendar grid computation ──
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startPad = firstDay.getDay(); // 0=Sun
    const totalDays = lastDay.getDate();

    const days = [];

    // Padding days from previous month
    for (let i = 0; i < startPad; i++) {
      const d = new Date(currentYear, currentMonth, -startPad + i + 1);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({ date: new Date(currentYear, currentMonth, i), isCurrentMonth: true });
    }

    // Padding days to fill last row (always show 6 rows = 42 cells)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(currentYear, currentMonth + 1, i), isCurrentMonth: false });
    }

    return days;
  }, [currentMonth, currentYear]);

  // ── Month navigation ──
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // ── Stats for current month ──
  const monthStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let total = 0;

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const endCompare = today < lastDay ? today : lastDay;

    for (let d = new Date(firstDay); d <= endCompare; d.setDate(d.getDate() + 1)) {
      // Skip if outside membership period
      if (mStart && d < stripTime(mStart)) continue;
      if (mEnd && d > stripTime(mEnd)) continue;

      // Skip Sundays (optional — gym may be closed)
      // For now, count all days

      total++;
      if (attendedDates.has(formatDateKey(d))) {
        present++;
      } else {
        absent++;
      }
    }

    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, total, rate };
  }, [currentMonth, currentYear, attendedDates, mStart, mEnd]);

  const monthLabel = new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const isNextDisabled =
    currentYear > today.getFullYear() ||
    (currentYear === today.getFullYear() && currentMonth >= today.getMonth());

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm', className)}>
      {/* ── Calendar Header ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h3 className="text-base font-bold text-slate-900">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={goToToday}
            className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded-md hover:bg-slate-200 transition-colors mr-1"
          >
            Today
          </button>
          <button
            onClick={goToPrevMonth}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToNextMonth}
            disabled={isNextDisabled}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Day-of-week headers ── */}
      <div className="grid grid-cols-7 px-5">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* ── Calendar Grid ── */}
      <div className="grid grid-cols-7 px-5 pb-4 gap-px">
        {calendarDays.map(({ date, isCurrentMonth }, idx) => {
          const dateKey = formatDateKey(date);
          const isToday = dateKey === formatDateKey(today);
          const isPresent = attendedDates.has(dateKey);
          const isFuture = stripTime(date) > stripTime(today);
          const isWithinMembership =
            (!mStart || stripTime(date) >= stripTime(mStart)) &&
            (!mEnd || stripTime(date) <= stripTime(mEnd));
          const isAbsent =
            isCurrentMonth && !isFuture && !isPresent && isWithinMembership;

          return (
            <div
              key={idx}
              className={cn(
                'relative flex flex-col items-center justify-center py-2.5 rounded-lg transition-colors',
                !isCurrentMonth && 'opacity-20',
                isToday && 'ring-2 ring-emerald-500/40 ring-offset-1',
                isPresent && isCurrentMonth && 'bg-emerald-50',
                isAbsent && 'bg-red-50/60',
              )}
            >
              {/* Date number */}
              <span
                className={cn(
                  'text-xs font-semibold leading-none',
                  isPresent && isCurrentMonth
                    ? 'text-emerald-800'
                    : isAbsent
                    ? 'text-red-400'
                    : isFuture
                    ? 'text-slate-300'
                    : 'text-slate-600'
                )}
              >
                {date.getDate()}
              </span>

              {/* Status icon */}
              {isCurrentMonth && !isFuture && (
                <div className="mt-0.5">
                  {isPresent ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : isAbsent ? (
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                  ) : !isWithinMembership ? (
                    <Minus className="w-3 h-3 text-slate-300" />
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Legend & Stats ── */}
      <div className="border-t border-slate-100 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Present
          </span>
          <span className="flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            Absent
          </span>
          <span className="flex items-center gap-1.5">
            <Minus className="w-3 h-3 text-slate-300" />
            No Membership
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="text-emerald-700">
            {monthStats.present} Present
          </span>
          <span className="text-red-500">
            {monthStats.absent} Absent
          </span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-bold',
              monthStats.rate >= 80
                ? 'bg-emerald-100 text-emerald-800'
                : monthStats.rate >= 50
                ? 'bg-amber-100 text-amber-800'
                : 'bg-red-100 text-red-800'
            )}
          >
            {monthStats.rate}% Rate
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──

/** Format a Date to 'YYYY-MM-DD' for consistent comparison */
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Strip time from a Date for day-level comparisons */
function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
