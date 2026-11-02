"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import ApplyLeaveModal from "@/components/ApplyLeaveModal";
import CscForm6Modal from "@/components/CscForm6Modal";
import CircularProgressMeter from "@/components/CircularProgressMeter";
import { useToast } from "@/components/Toast";
import RightRail from "@/components/RightRail";
import {
  Calendar,
  CheckCircle2,
  Clock,
  HeartPulse,
  Palmtree,
  Plus,
  Search,
  Download,
  CalendarCheck2,
  X,
  FileCheck,
} from "lucide-react";

export default function DashboardPage() {
  const { toast } = useToast();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedCscLeaveId, setSelectedCscLeaveId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leavesRes, balancesRes, typesRes, meRes] = await Promise.all([
        fetch("/api/leaves"),
        fetch("/api/balances"),
        fetch("/api/leave-types"),
        fetch("/api/auth/me"),
      ]);

      if (leavesRes.ok) {
        const data = await leavesRes.json();
        setLeaves(data.leaves || []);
      }
      if (balancesRes.ok) {
        const data = await balancesRes.json();
        setBalances(data.balances || []);
      }
      if (typesRes.ok) {
        const data = await typesRes.json();
        setLeaveTypes(data.leaveTypes || []);
      }
      if (meRes.ok) {
        const data = await meRes.json();
        setUserProfile(data.user);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancelLeave = async (leaveId: string, reqNumber: string) => {
    if (!confirm(`Are you sure you want to withdraw leave application ${reqNumber}?`)) return;

    try {
      const res = await fetch(`/api/leaves/${leaveId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to withdraw request.");
      } else {
        toast.success(`Leave application ${reqNumber} has been withdrawn.`);
        fetchData();
      }
    } catch {
      toast.error("Network error occurred.");
    }
  };

  const handleRequestCancellation = async (leaveId: string, reqNumber: string) => {
    const reason = prompt(`Enter reason for requesting cancellation of approved leave ${reqNumber}:`);
    if (!reason || reason.trim().length === 0) return;

    try {
      const res = await fetch(`/api/leaves/${leaveId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to submit cancellation request.");
      } else {
        toast.pending(
          `Cancellation request for ${reqNumber} submitted. Pending supervisor approval.`
        );
        fetchData();
      }
    } catch {
      toast.error("Network communication error.");
    }
  };

  // Quotas calculations
  const vacationBal = balances.find((b) => b.leaveType?.code === "VL");
  const vacAvailable = vacationBal
    ? Number(vacationBal.totalAllocated) +
      Number(vacationBal.carriedOver) -
      Number(vacationBal.usedDays) -
      Number(vacationBal.pendingDays)
    : 0;
  const vacTotal = vacationBal
    ? Number(vacationBal.totalAllocated) + Number(vacationBal.carriedOver)
    : 15;
  const vacPct = vacTotal > 0 ? Math.round((vacAvailable / vacTotal) * 100) : 100;

  const sickBal = balances.find((b) => b.leaveType?.code === "SL");
  const sickAvailable = sickBal
    ? Number(sickBal.totalAllocated) +
      Number(sickBal.carriedOver) -
      Number(sickBal.usedDays) -
      Number(sickBal.pendingDays)
    : 0;
  const sickTotal = sickBal
    ? Number(sickBal.totalAllocated) + Number(sickBal.carriedOver)
    : 10;
  const sickPct = sickTotal > 0 ? Math.round((sickAvailable / sickTotal) * 100) : 100;

  const totalUsedDays = balances.reduce((sum, b) => sum + Number(b.usedDays || 0), 0);
  const totalAllocatedAll =
    balances.reduce(
      (sum, b) => sum + Number(b.totalAllocated || 0) + Number(b.carriedOver || 0),
      0
    ) || 30;

  const pendingRequestsCount = leaves.filter(
    (l) => l.status === "PENDING" || l.status === "MANAGER_APPROVED"
  ).length;

  // Filter leaves
  const filteredLeaves = leaves.filter((leave) => {
    const matchesStatus = statusFilter === "ALL" || leave.status === statusFilter;
    const matchesSearch =
      leave.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.leaveType?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${leave.user?.firstName} ${leave.user?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <Header
        title="Workspace"
        subtitle={userProfile ? `${userProfile.firstName} ${userProfile.lastName} • ${userProfile.department || "General"}` : undefined}
        breadcrumbs={["Portal", "Overview"]}
      />

      {/* Main Content Workspace Layout */}
      <div className="flex-1 flex gap-5 overflow-hidden px-5 sm:px-8 pb-6 pt-4 animate-fade-in">
        {/* Center Primary Scrollable Stage */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-0.5">
          {/* 1. Outcrowd-Style Circular Metric Strip (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
            {/* Metric 1: Vacation Leave */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_6px_16px_-6px_rgba(0,0,0,0.03)] hover:shadow-card hover:-translate-y-1 transition-all duration-200 cursor-default flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Vacation Leave
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 tracking-tight font-mono tabular-nums">
                    {vacAvailable.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ {vacTotal} d</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-medium block mt-1">
                  ● {vacPct}% available
                </span>
              </div>
              <CircularProgressMeter
                value={vacAvailable}
                max={vacTotal}
                colorClass="text-emerald-500"
                symbol="VL"
              />
            </div>

            {/* Metric 2: Sick Leave */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_6px_16px_-6px_rgba(0,0,0,0.03)] hover:shadow-card hover:-translate-y-1 transition-all duration-200 cursor-default flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Medical / Sick
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 tracking-tight font-mono tabular-nums">
                    {sickAvailable.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ {sickTotal} d</span>
                </div>
                <span className="text-[11px] text-corporate-700 font-medium block mt-1">
                  ● {sickPct}% available
                </span>
              </div>
              <CircularProgressMeter
                value={sickAvailable}
                max={sickTotal}
                colorClass="text-corporate-600"
                symbol="SL"
              />
            </div>

            {/* Metric 3: In-Flight Pending */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_6px_16px_-6px_rgba(0,0,0,0.03)] hover:shadow-card hover:-translate-y-1 transition-all duration-200 cursor-default flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Awaiting Review
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 tracking-tight font-mono tabular-nums">
                    {pendingRequestsCount}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">active</span>
                </div>
                <span
                  className={`text-[11px] font-medium block mt-1 ${
                    pendingRequestsCount > 0 ? "text-amber-600 font-semibold" : "text-slate-400"
                  }`}
                >
                  {pendingRequestsCount > 0 ? "◷ Pending review" : "✓ All cleared"}
                </span>
              </div>
              <CircularProgressMeter
                value={pendingRequestsCount}
                max={Math.max(pendingRequestsCount, 5)}
                colorClass="text-amber-500"
                symbol="◷"
              />
            </div>

            {/* Metric 4: Used / Cleared */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_6px_16px_-6px_rgba(0,0,0,0.03)] hover:shadow-card hover:-translate-y-1 transition-all duration-200 cursor-default flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Utilized Quota
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 tracking-tight font-mono tabular-nums">
                    {totalUsedDays.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ {totalAllocatedAll.toFixed(0)} d</span>
                </div>
                <span className="text-[11px] text-purple-700 font-medium block mt-1">
                  ✓ Recorded absences
                </span>
              </div>
              <CircularProgressMeter
                value={totalUsedDays}
                max={totalAllocatedAll}
                colorClass="text-purple-600"
                symbol="✓"
              />
            </div>
          </div>

          {/* 2. Decluttered Application Register Table */}
          <div className="bg-white rounded-lg border border-slate-200/70 shadow-subtle overflow-hidden">
            {/* Toolbar */}
            <div className="p-3.5 sm:px-5 border-b border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Leave Applications
                </h3>
                <span className="text-[11px] text-slate-400">({filteredLeaves.length})</span>
              </div>

              {/* Action Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-7 pr-2.5 py-1 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 w-36 transition placeholder:text-slate-400"
                  />
                </div>

                {/* Status Tabs */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-md">
                  {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2 py-0.5 text-xs font-medium rounded transition-all duration-150 ${
                        statusFilter === st
                          ? "bg-white text-slate-900 shadow-subtle font-semibold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {st === "ALL" ? "All" : st.replace("_", " ")}
                    </button>
                  ))}
                </div>

                {/* Symbol-focused Export */}
                <a
                  href={`/api/admin/export?status=${statusFilter}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 transition-all duration-150 shadow-subtle hover:scale-105 active:scale-95"
                  title="Export to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export</span>
                </a>

                {/* Symbol-focused Apply Button */}
                <button
                  onClick={() => setIsApplyModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-corporate-600 hover:bg-corporate-700 text-white text-xs font-semibold shadow-subtle hover:shadow-card hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Apply</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">ID</th>
                    <th className="py-2.5 px-4 font-semibold">Employee</th>
                    <th className="py-2.5 px-4 font-semibold">Category</th>
                    <th className="py-2.5 px-4 font-semibold">Dates</th>
                    <th className="py-2.5 px-4 font-semibold">Days</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">
                        Loading leave records...
                      </td>
                    </tr>
                  ) : filteredLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 font-medium">
                        No leave records matching this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLeaves.map((leave) => {
                      const isOwner = userProfile?.id === leave.userId;
                      const canCancel =
                        isOwner &&
                        (leave.status === "PENDING" || leave.status === "MANAGER_APPROVED");

                      return (
                        <tr key={leave.id} className="table-row-hover">
                          <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                            {leave.requestNumber}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-medium text-slate-900">
                              {leave.user?.firstName} {leave.user?.lastName}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-800">
                            {leave.leaveType?.name}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                            {new Date(leave.startDate).toLocaleDateString()} —{" "}
                            {new Date(leave.endDate).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">
                            {Number(leave.totalDays).toFixed(1)} d
                          </td>
                          <td className="py-2.5 px-4">
                            <StatusBadge status={leave.status} size="sm" />
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => setSelectedCscLeaveId(leave.id)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-all duration-150 hover:scale-105 active:scale-95"
                                title="Official CSC Form No. 6"
                              >
                                <FileCheck className="w-3 h-3 text-emerald-600" />
                                <span>Form 6</span>
                              </button>

                              {canCancel && (
                                <button
                                  onClick={() => handleCancelLeave(leave.id, leave.requestNumber)}
                                  className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-all duration-150 hover:scale-105 active:scale-95"
                                  title="Withdraw Request"
                                >
                                  <span className="font-bold">✕</span>
                                  <span>Withdraw</span>
                                </button>
                              )}

                              {isOwner && leave.status === "APPROVED" && (
                                <button
                                  onClick={() => handleRequestCancellation(leave.id, leave.requestNumber)}
                                  className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition-all duration-150 hover:scale-105 active:scale-95"
                                  title="Request Leave Cancellation"
                                >
                                  <span className="font-bold">⊘</span>
                                  <span>Cancel</span>
                                </button>
                              )}

                              {leave.status === "CANCELLATION_REQUESTED" && (
                                <span className="text-[10px] text-orange-600 font-medium italic">
                                  Reviewing
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-4 py-2 border-t border-slate-200/70 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{filteredLeaves.length} records</span>
              <span>Strict RBAC</span>
            </div>
          </div>
        </div>

        {/* Right Rail Panel */}
        {userProfile && (
          <RightRail
            user={{
              id: userProfile.id,
              employeeCode: userProfile.employeeCode,
              firstName: userProfile.firstName,
              lastName: userProfile.lastName,
              role: userProfile.role,
              department: userProfile.department,
            }}
            onApplyClick={() => setIsApplyModalOpen(true)}
          />
        )}
      </div>

      {/* Leave Application Modal */}
      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={() => {
          toast.success("Your leave application has been submitted.");
          fetchData();
        }}
        leaveTypes={leaveTypes}
        balances={balances}
      />

      {/* Official Civil Service Commission Form No. 6 Modal */}
      {selectedCscLeaveId && (
        <CscForm6Modal
          leaveId={selectedCscLeaveId}
          isOpen={!!selectedCscLeaveId}
          onClose={() => setSelectedCscLeaveId(null)}
        />
      )}
    </div>
  );
}