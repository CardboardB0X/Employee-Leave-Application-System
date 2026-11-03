"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import { Search, FileCheck, CheckCircle2, Clock, XCircle } from "lucide-react";

// Performance Optimization: Dynamically load heavy approval and CSC Form 6 modals
const ApprovalActionModal = dynamic(() => import("@/components/ApprovalActionModal"), {
  ssr: false,
});

const CscForm6Modal = dynamic(() => import("@/components/CscForm6Modal"), {
  ssr: false,
});

export default function ApprovalsPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCscLeaveId, setSelectedCscLeaveId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filterType, setFilterType] = useState<"PENDING_ALL" | "CANCELLATIONS" | "ALL">("PENDING_ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/leaves");
      if (res.ok) {
        const data = await res.json();
        setLeaves(data.leaves || []);
      }
    } catch (err) {
      console.error("Error fetching approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const { pendingLeaves, cancellationLeaves, approvedLeaves, rejectedLeaves } = useMemo(() => {
    return {
      pendingLeaves: leaves.filter(
        (l) => l.status === "PENDING" || l.status === "MANAGER_APPROVED" || l.status === "CANCELLATION_REQUESTED"
      ),
      cancellationLeaves: leaves.filter((l) => l.status === "CANCELLATION_REQUESTED"),
      approvedLeaves: leaves.filter((l) => l.status === "APPROVED"),
      rejectedLeaves: leaves.filter((l) => l.status === "REJECTED"),
    };
  }, [leaves]);

  const displayedLeaves = useMemo(() => {
    const base =
      filterType === "PENDING_ALL"
        ? pendingLeaves
        : filterType === "CANCELLATIONS"
        ? cancellationLeaves
        : leaves;

    if (!searchQuery) return base;
    const q = searchQuery.toLowerCase();
    return base.filter((leave) => {
      const matchesNumber = leave.requestNumber.toLowerCase().includes(q);
      const matchesUser = `${leave.user?.firstName} ${leave.user?.lastName}`.toLowerCase().includes(q);
      const matchesType = leave.leaveType?.name.toLowerCase().includes(q);
      return matchesNumber || matchesUser || matchesType;
    });
  }, [filterType, pendingLeaves, cancellationLeaves, leaves, searchQuery]);

  const handleOpenReview = (leave: any) => {
    setSelectedLeave(leave);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <Header
        title="Approvals"
        subtitle="Subordinate leave requests and reviews"
        breadcrumbs={["Supervisory", "Approvals"]}
      />

      <main className="flex-1 overflow-y-auto px-4 sm:px-8 pb-6 pt-4 space-y-4 animate-fade-in">
        {actionMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between border shadow-subtle animate-slide-down ${
              actionMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="font-bold">✓</span>
              {actionMessage.text}
            </span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-slate-400 hover:text-slate-600 ml-4 font-bold text-sm"
            >
              ×
            </button>
          </div>
        )}

        {/* Supervisory Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_6px_16px_-6px_rgba(0,0,0,0.03)] hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Awaiting Decision</p>
              <p className="text-2xl font-black text-slate-900 mt-1 font-mono tabular-nums">{pendingLeaves.length}</p>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">◷ Requires supervisor action</p>
            </div>
            <span className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base border border-amber-200/60 shadow-subtle">
              ◷
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_6px_16px_-6px_rgba(0,0,0,0.03)] hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Approved</p>
              <p className="text-2xl font-black text-slate-900 mt-1 font-mono tabular-nums">{approvedLeaves.length}</p>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">✓ Certified & recorded</p>
            </div>
            <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base border border-emerald-200/60 shadow-subtle">
              ✓
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_6px_16px_-6px_rgba(0,0,0,0.03)] hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rejected</p>
              <p className="text-2xl font-black text-slate-900 mt-1 font-mono tabular-nums">{rejectedLeaves.length}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">✕ Quota restored to user</p>
            </div>
            <span className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-base border border-slate-200 shadow-subtle">
              ✕
            </span>
          </div>
        </div>

        {/* Table / Mobile Cards Container */}
        <div
          tabIndex={0}
          role="region"
          aria-label="Approvals Register"
          className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden content-visibility-auto"
        >
          {/* Controls Bar */}
          <div className="p-3.5 sm:px-5 border-b border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl overflow-x-auto">
              <button
                onClick={() => setFilterType("PENDING_ALL")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 whitespace-nowrap ${
                  filterType === "PENDING_ALL"
                    ? "bg-white text-slate-900 shadow-subtle font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Needs Action ({pendingLeaves.length})
              </button>
              <button
                onClick={() => setFilterType("CANCELLATIONS")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 whitespace-nowrap ${
                  filterType === "CANCELLATIONS"
                    ? "bg-white text-slate-900 shadow-subtle font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cancellations ({cancellationLeaves.length})
              </button>
              <button
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 whitespace-nowrap ${
                  filterType === "ALL"
                    ? "bg-white text-slate-900 shadow-subtle font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All History ({leaves.length})
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search applicant or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-52 pl-8 pr-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px] sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">ID</th>
                  <th className="py-2.5 px-4 font-semibold">Employee</th>
                  <th className="py-2.5 px-4 font-semibold">Category</th>
                  <th className="py-2.5 px-4 font-semibold">Dates</th>
                  <th className="py-2.5 px-4 font-semibold">Duration</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">
                      Loading approvals...
                    </td>
                  </tr>
                ) : displayedLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 font-medium">
                      No applications requiring action.
                    </td>
                  </tr>
                ) : (
                  displayedLeaves.map((leave) => {
                    const isPending =
                      leave.status === "PENDING" || leave.status === "MANAGER_APPROVED" || leave.status === "CANCELLATION_REQUESTED";

                    return (
                      <tr key={leave.id} className="table-row-hover">
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                          {leave.requestNumber}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="font-medium text-slate-900 block">
                            {leave.user?.firstName} {leave.user?.lastName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {leave.user?.department?.name || "Dept"} • {leave.user?.employeeCode}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">
                          {leave.leaveType?.name}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                          {new Date(leave.startDate).toLocaleDateString()} —{" "}
                          {new Date(leave.endDate).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900 font-mono">
                          {Number(leave.totalDays).toFixed(1)} d
                        </td>
                        <td className="py-2.5 px-4">
                          <StatusBadge status={leave.status} size="sm" />
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => setSelectedCscLeaveId(leave.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-all duration-150 hover:scale-105 active:scale-95"
                              title="Official CSC Form No. 6"
                            >
                              <FileCheck className="w-3 h-3 text-emerald-600" />
                              <span>Form 6</span>
                            </button>

                            {isPending ? (
                              <button
                                onClick={() => handleOpenReview(leave)}
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-corporate-600 hover:bg-corporate-700 rounded-lg shadow-subtle hover:scale-105 active:scale-95 transition-all duration-150"
                              >
                                <span>{leave.status === "CANCELLATION_REQUESTED" ? "Cancel Review" : "Review"}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenReview(leave)}
                                className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                              >
                                Details
                              </button>
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

          {/* Mobile Stacked Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="text-center py-8 text-slate-400 font-medium text-xs">
                Loading approvals...
              </div>
            ) : displayedLeaves.length === 0 ? (
              <div className="text-center py-10 text-slate-400 font-medium text-xs">
                No applications requiring action.
              </div>
            ) : (
              displayedLeaves.map((leave) => {
                const isPending =
                  leave.status === "PENDING" || leave.status === "MANAGER_APPROVED" || leave.status === "CANCELLATION_REQUESTED";

                return (
                  <div key={leave.id} className="p-4 space-y-3 bg-white hover:bg-slate-50/70 transition-colors">
                    {/* Top Row: Applicant & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-xs text-slate-900">
                          {leave.user?.firstName} {leave.user?.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {leave.user?.department?.name || "Dept"} • {leave.requestNumber}
                        </p>
                      </div>
                      <StatusBadge status={leave.status} size="sm" />
                    </div>

                    {/* Middle Row: Type & Dates */}
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-800 text-[11px]">
                          {leave.leaveType?.name}
                        </span>
                        <p className="text-[11px] font-mono text-slate-400 mt-1">
                          {new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-corporate-50 border border-corporate-200/80 text-corporate-800 font-mono font-bold text-xs">
                          {Number(leave.totalDays).toFixed(1)} days
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Mobile Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedCscLeaveId(leave.id)}
                        className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 active:scale-95 transition-all"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Form 6</span>
                      </button>

                      {isPending ? (
                        <button
                          onClick={() => handleOpenReview(leave)}
                          className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-corporate-600 hover:bg-corporate-700 rounded-xl shadow-subtle active:scale-95 transition-all"
                        >
                          <span>{leave.status === "CANCELLATION_REQUESTED" ? "Cancel Review" : "Review"}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenReview(leave)}
                          className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl active:scale-95 transition-all"
                        >
                          <span>Details</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-slate-200/70 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>{displayedLeaves.length} applications</span>
            <span>Audit Logged</span>
          </div>
        </div>
      </main>

      {/* Heavy Approval Action Modal (Dynamically Imported) */}
      {isModalOpen && (
        <ApprovalActionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setActionMessage({
              type: "success",
              text: "Application decision recorded.",
            });
            fetchApprovals();
          }}
          leave={selectedLeave}
        />
      )}

      {/* Official CSC Form No. 6 Modal (Dynamically Imported) */}
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
