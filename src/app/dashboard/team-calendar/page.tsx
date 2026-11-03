"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
} from "lucide-react";
import {
  addMonths,
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";

export default function TeamCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const [calRes, holRes, deptRes] = await Promise.all([
        fetch("/api/calendar"),
        fetch("/api/holidays"),
        fetch("/api/departments"),
      ]);

      if (calRes.ok) {
        const data = await calRes.json();
        setEvents(data.events || []);
      }
      if (holRes.ok) {
        const hData = await holRes.json();
        setHolidays(hData.holidays || []);
      }
      if (deptRes.ok) {
        const dData = await deptRes.json();
        setDepartments(dData.departments || []);
      }
    } catch (err) {
      console.error("Calendar fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const filteredEvents = selectedDept === "ALL"
    ? events
    : events.filter((ev) => ev.user?.department?.code === selectedDept || ev.user?.department?.id === selectedDept);

  const getDayLeaves = (day: Date) => {
    return filteredEvents.filter((ev) => {
      const s = new Date(ev.startDate);
      const e = new Date(ev.endDate);
      const targetTime = day.getTime();
      return targetTime >= s.setHours(0, 0, 0, 0) && targetTime <= e.setHours(23, 59, 59, 999);
    });
  };

  const getDayHoliday = (day: Date) => {
    const formatted = format(day, "yyyy-MM-dd");
    return holidays.find((h) => format(new Date(h.date), "yyyy-MM-dd") === formatted);
  };

  const selectedDayLeaves = getDayLeaves(selectedDay);
  const selectedDayHoliday = getDayHoliday(selectedDay);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <Header
        title="Team Calendar"
        subtitle="Department schedules and statutory holidays"
        breadcrumbs={["Workspace", "Calendar"]}
      />

      <main className="flex-1 flex flex-col lg:flex-row gap-5 overflow-y-auto px-4 sm:px-8 pb-6 pt-4 animate-fade-in">
        {/* Main Calendar Stage */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden min-h-[420px]">
          {/* Calendar Toolbar */}
          <div className="p-3.5 border-b border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white">
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-bold text-slate-900">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="w-6 h-6 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center transition-all duration-150 active:scale-90"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-2 py-0.5 text-xs font-medium rounded bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="w-6 h-6 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center transition-all duration-150 active:scale-90"
                  title="Next Month"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3 h-3 text-slate-400" />
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="text-xs rounded-md border border-slate-200 px-2 py-1 bg-white text-slate-700 focus:outline-none focus:border-corporate-600"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.code}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <a
                href="/api/admin/export?status=APPROVED"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 transition-all duration-150 hover:scale-105 active:scale-95"
              >
                <Download className="w-3 h-3 text-slate-500" />
                <span>Export</span>
              </a>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-200/70 bg-slate-50/70 text-center text-[11px] font-semibold text-slate-500 py-1.5">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Calendar Grid */}
          <div className="flex-1 grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 overflow-y-auto">
            {days.map((day, idx) => {
              const dayLeaves = getDayLeaves(day);
              const holiday = getDayHoliday(day);
              const inCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = isSameDay(day, selectedDay);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[88px] p-1.5 flex flex-col justify-between transition-colors duration-150 cursor-pointer select-none ${
                    isSelected
                      ? "bg-blue-50/50 ring-1 ring-corporate-600 ring-inset"
                      : inCurrentMonth
                      ? "bg-white hover:bg-slate-50/80"
                      : "bg-slate-50/40 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold rounded px-1 py-0.2 ${
                        isTodayDate
                          ? "bg-corporate-600 text-white font-bold"
                          : inCurrentMonth
                          ? "text-slate-700"
                          : "text-slate-400"
                      }`}
                    >
                      {format(day, "d")}
                    </span>

                    {holiday && (
                      <span className="text-[10px] font-medium text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200/70 truncate max-w-[80px]" title={holiday.name}>
                        ★ {holiday.name}
                      </span>
                    )}
                  </div>

                  {/* Day Leave Badges */}
                  <div className="space-y-1 overflow-hidden">
                    {dayLeaves.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className="px-1 py-0.5 rounded text-[10px] font-medium truncate flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-200/60"
                      >
                        <span className="font-bold text-corporate-700">{ev.leaveType?.code}</span>
                        <span className="truncate">{ev.user?.firstName} {ev.user?.lastName?.[0]}.</span>
                      </div>
                    ))}
                    {dayLeaves.length > 2 && (
                      <span className="text-[10px] font-semibold text-corporate-600 block pl-1">
                        +{dayLeaves.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Detail Sidebar */}
        <aside className="w-full lg:w-72 shrink-0 bg-white rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col justify-between overflow-hidden">
          <div className="p-3.5 border-b border-slate-200/70 bg-slate-50/70">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Day Breakdown
            </span>
            <h4 className="text-xs font-bold text-slate-900 mt-0.5">
              {format(selectedDay, "EEE, MMM d, yyyy")}
            </h4>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
            {selectedDayHoliday && (
              <div className="p-2.5 rounded-md bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs">
                <p className="font-bold">★ {selectedDayHoliday.name}</p>
                <p className="text-[10px] text-amber-700 mt-0.5">Official statutory holiday (Exempt)</p>
              </div>
            )}

            <div>
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                On Leave ({selectedDayLeaves.length})
              </span>

              {selectedDayLeaves.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 font-medium">
                  All team members active.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selectedDayLeaves.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2.5 rounded-md border border-slate-200/80 bg-slate-50/50 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {ev.user?.firstName} {ev.user?.lastName}
                        </span>
                        <StatusBadge status={ev.status} size="sm" />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {ev.user?.department?.name || "Dept"} • {ev.leaveType?.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-2.5 border-t border-slate-200/70 bg-slate-50/50 text-[11px] text-slate-400 text-center font-mono">
            2026 Calendar
          </div>
        </aside>
      </main>
    </div>
  );
}