"use client";

import { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Users,
  Plus,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";

interface RightRailProps {
  user: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    role: string;
    department: string;
  };
  onApplyClick: () => void;
}

export default function RightRail({ user, onApplyClick }: RightRailProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [hoveredDayData, setHoveredDayData] = useState<{ day: Date; leaves: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRailData = async () => {
      try {
        setLoading(true);
        const [calRes, leavesRes] = await Promise.all([
          fetch("/api/calendar"),
          fetch("/api/leaves?status=PENDING"),
        ]);

        if (calRes.ok) {
          const calData = await calRes.json();
          setCalendarEvents(calData.events || []);
        }

        if (leavesRes.ok) {
          const leavesData = await leavesRes.json();
          setPendingApprovals(leavesData.leaves || []);
        }
      } catch (err) {
        console.error("Rail data error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRailData();
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayLeaves = (day: Date) => {
    return calendarEvents.filter((ev) => {
      const s = new Date(ev.startDate);
      const e = new Date(ev.endDate);
      const targetTime = day.getTime();
      return targetTime >= s.setHours(0, 0, 0, 0) && targetTime <= e.setHours(23, 59, 59, 999);
    });
  };

  const upcomingAbsences = calendarEvents.slice(0, 5);
  const isSupervisor = ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"].includes(user.role);

  return (
    <aside className="w-full shrink-0 flex flex-col gap-4 select-none relative">
      {/* 1. Primary Action Button (Outcrowd Pill with Soft Elevation) */}
      <button
        onClick={onApplyClick}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-corporate-600 hover:bg-corporate-700 text-white text-xs font-semibold shadow-[0_2px_8px_rgba(15,23,42,0.12)] hover:shadow-card hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Request Leave</span>
      </button>

      {/* 2. Supervisory Quick Alert */}
      {isSupervisor && pendingApprovals.length > 0 && (
        <div className="bg-amber-50/80 rounded-2xl p-3.5 border border-amber-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2 animate-slide-down">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Pending Action ({pendingApprovals.length})</span>
            </span>
            <a
              href="/dashboard/approvals"
              className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-0.5 transition-colors"
            >
              <span>Review →</span>
            </a>
          </div>

          <p className="text-xs text-slate-700 leading-snug">
            <strong>
              {pendingApprovals[0]?.user?.firstName} {pendingApprovals[0]?.user?.lastName}
            </strong>
            <span className="text-slate-500">
              {" "}• {pendingApprovals[0]?.totalDays}d ({pendingApprovals[0]?.leaveType?.code})
            </span>
          </p>
        </div>
      )}

      {/* 3. Mini Calendar Widget with Hover Absence Popover */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_6px_16px_-6px_rgba(0,0,0,0.03)] relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-corporate-600" />
            <span className="text-xs font-bold text-slate-800">
              {format(currentMonth, "MMMM yyyy")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="w-6 h-6 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/70 flex items-center justify-center transition-all duration-150 active:scale-90"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="w-6 h-6 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/70 flex items-center justify-center transition-all duration-150 active:scale-90"
              aria-label="Next month"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-1.5">
          <span>S</span>
          <span>M</span>
          <span>T</span>
          <span>W</span>
          <span>T</span>
          <span>F</span>
          <span>S</span>
        </div>

        {/* Day Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            const dayLeaves = getDayLeaves(day);
            const hasLeaves = dayLeaves.length > 0;
            const isSelected = isSameDay(day, selectedDate);
            const inCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);

            return (
              <div
                key={idx}
                className="relative"
                onMouseEnter={() => hasLeaves && setHoveredDayData({ day, leaves: dayLeaves })}
                onMouseLeave={() => setHoveredDayData(null)}
              >
                <button
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className={`w-full h-7 rounded-lg text-[11px] font-medium flex flex-col items-center justify-center relative transition-all duration-150 hover:scale-110 active:scale-95 ${
                    isSelected
                      ? "bg-corporate-600 text-white font-bold shadow-subtle"
                      : isTodayDate
                      ? "bg-corporate-50 text-corporate-700 font-bold border border-corporate-200"
                      : "text-slate-700 hover:bg-slate-100/70"
                  } ${!inCurrentMonth ? "opacity-25" : ""}`}
                >
                  <span>{format(day, "d")}</span>
                  {hasLeaves && (
                    <span
                      className={`w-1 h-1 rounded-full absolute bottom-1 ${
                        isSelected ? "bg-white" : "bg-emerald-500"
                      }`}
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Glassmorphic Absence Tooltip Popover */}
        {hoveredDayData && (
          <div className="absolute top-12 left-4 right-4 bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl z-30 border border-slate-700 text-xs animate-scale-in space-y-1.5 pointer-events-none">
            <div className="flex items-center justify-between border-b border-slate-700 pb-1">
              <span className="font-bold text-[11px] text-emerald-400">
                {format(hoveredDayData.day, "EEEE, MMMM d")}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {hoveredDayData.leaves.length} away
              </span>
            </div>
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {hoveredDayData.leaves.map((l, lIdx) => (
                <div key={lIdx} className="flex items-center justify-between text-[11px]">
                  <span className="truncate font-medium text-slate-200">
                    {l.user?.firstName} {l.user?.lastName}
                  </span>
                  <span className="text-[9px] font-mono uppercase bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded border border-slate-700 shrink-0 ml-1">
                    {l.leaveType?.code}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Team Absences Live Feed (Outcrowd Chips) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_6px_16px_-6px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-corporate-600" />
            <span className="text-xs font-bold text-slate-800">
              Team Absences
            </span>
          </div>
          <a
            href="/dashboard/team-calendar"
            className="text-[11px] font-bold text-corporate-600 hover:text-corporate-800 transition-colors"
          >
            All →
          </a>
        </div>

        {upcomingAbsences.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium text-center py-4">
            No team members away.
          </p>
        ) : (
          <div className="space-y-2">
            {upcomingAbsences.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:bg-slate-100/70 transition-all duration-150 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                    {event.user?.firstName?.[0]}
                    {event.user?.lastName?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {event.user?.firstName} {event.user?.lastName}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {event.leaveType?.code} • {event.totalDays}d
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                  {new Date(event.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
