"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import ApprovalActionModal from "@/components/ApprovalActionModal";
import CscForm6Modal from "@/components/CscForm6Modal";
import { Search, FileCheck } from "lucide-react";

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

  const pendingLeaves = leaves.filter(
    (l) => l.status === "PENDING" || l.status === "MANAGER_APPROVED" || l.status === "CANCELLATION_REQUESTED"
  );
  const cancellationLeaves = leaves.filter((l) => l.status === "CANCELLATION_REQUESTED");
  const approvedLeaves = leaves.filter((l) => l.status === "APPROVED");
  const rejectedLeaves = leaves.filter((l) => l.status === "REJECTED");

  const baseLeaves =
    filterType === "PENDING_ALL"
      ? pendingLeaves
      : filterType === "CANCELLATIONS"
      ? cancellationLeaves
      : leaves;

  const displayedLeaves = baseLeaves.filter((leave) => {
    const q = searchQuery.toLowerCase();
    const matchesNumber = leave.requestNumber.toLowerCase().includes(q);
    const matchesUser = `${leave.user?.firstName} ${leave.user?.lastName}`.toLowerCase().includes(q);
    const matchesType = leave.leaveType?.name.toLowerCase().includes(q);
    return matchesNumber || matchesUser || matchesType;
  });

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

      <main className="flex-1 overflow-y-auto px-5 sm:px-8 pb-6 pt-4 space-y-4 animate-fade-in">
        {actionMessage && (
          <div
            className={`p-3 rounded-md text-xs font-medium flex items-center justify-between border shadow-subtle animate-slide-down ${
              actionMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="font-bold">✓</span>
              {actionMessage.text}
            </span>
            <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600 ml-4 font-bold">
              ×
            </button>
          </div>
        )}

        {/* Supervisory Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-white rounded-lg p-3.5 border border-slate-200/70 shadow-subtle hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Awaiting Decision</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{pendingLeaves.length}</p>
              <p className="text-[11px] text-amber-600 mt-0.5">◷ Requires action</p>
            </div>
            <span className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm border border-amber-200/60">
              ◷
            </span>
          </div>

          <div className="bg-white rounded-lg p-3.5 border border-slate-200/70 shadow-subtle hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Approved</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{approvedLeaves.length}</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">✓ Cleared</p>
            </div>
            <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm border border-emerald-200/60">
              ✓
            </span>
          </div>

          <div className="bg-white rounded-lg p-3.5 border border-slate-200/70 shadow-subtle hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Rejected</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{rejectedLeaves.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">✕ Quota restored</p>
            </div>
            <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm border border-slate-200">
              ✕
            </span>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-lg border border-slate-200/70 shadow-subtle overflow-hidden">
          {/* Controls Bar */}
          <div className="p-3.5 sm:px-5 border-b border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-md">
              <button
                onClick={() => setFilterType("PENDING_ALL")}
                className={`px-3 py-1 text-xs font-medium rounded transition-all duration-150 ${
                  filterType === "PENDING_ALL"
                    ? "bg-white text-slate-900 shadow-subtle font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Needs Action ({pendingLeaves.length})
              </button>
              <button
                onClick={() => setFilterType("CANCELLATIONS")}
                className={`px-3 py-1 text-xs font-medium rounded transition-all duration-150 ${
                  filterType === "CANCELLATIONS"
                    ? "bg-white text-slate-900 shadow-subtle font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cancellations ({cancellationLeaves.length})
              </button>
              <button
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1 text-xs font-medium rounded transition-all duration-150 ${
                  filterType === "ALL"
                    ? "bg-white text-slate-900 shadow-subtle font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All History ({leaves.length})
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search applicant or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-2.5 py-1 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 w-48 transition placeholder:text-slate-400"
              />
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
                      leave.status === "PENDING" || leave.status === "MANAGER_APPROVED";

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

                            {isPending ? (
                              <button
                                onClick={() => handleOpenReview(leave)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-corporate-600 hover:bg-corporate-700 rounded-md shadow-subtle hover:scale-105 active:scale-95 transition-all duration-150"
                              >
                                <span>{leave.status === "CANCELLATION_REQUESTED" ? "Cancel Review" : "Review"}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenReview(leave)}
                                className="px-2 py-0.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
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

          <div className="px-4 py-2 border-t border-slate-200/70 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>{displayedLeaves.length} applications</span>
            <span>Audit Logged</span>
          </div>
        </div>
      </main>

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

      {/* Official CSC Form No. 6 Modal */}
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