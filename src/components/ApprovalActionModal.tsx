"use client";

import { useState } from "react";
import { X, Check, XCircle, AlertCircle, FileText } from "lucide-react";
import StatusBadge from "./StatusBadge";

interface ApprovalActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leave: any;
}

export default function ApprovalActionModal({
  isOpen,
  onClose,
  onSuccess,
  leave,
}: ApprovalActionModalProps) {
  const [action, setAction] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !leave) return null;

  const handleActionSubmit = async (selectedAction: "APPROVED" | "REJECTED") => {
    setAction(selectedAction);
    setError(null);

    if (selectedAction === "REJECTED" && (!comments || comments.trim().length < 5)) {
      setError("Please provide a constructive reason for rejection (at least 5 characters).");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/leaves/${leave.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: selectedAction,
          comments: comments.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Action could not be completed.");
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Network or server communication error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-dropdown border border-slate-200 w-full max-w-md overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Review Application
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{leave.requestNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3.5">
          {error && (
            <div className="rounded-md bg-rose-50 p-2.5 text-xs font-medium text-rose-700 flex items-start gap-2 border border-rose-200 animate-slide-down">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Details Card */}
          <div className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {leave.user?.firstName} {leave.user?.lastName}
                </p>
                <p className="text-[11px] text-slate-400">
                  {leave.user?.department?.name || "Dept"} • {leave.user?.employeeCode}
                </p>
              </div>
              <StatusBadge status={leave.status} size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Type</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{leave.leaveType?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Duration</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{leave.totalDays} day(s)</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Dates</span>
                <span className="font-medium text-slate-700 mt-0.5 block">
                  {new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Reason</span>
              <p className="text-slate-700 mt-0.5">{leave.reason}</p>
            </div>

            {leave.cancellationReason && (
              <div className="pt-2 border-t border-slate-200/60 text-xs bg-orange-50/80 p-2.5 rounded-md border border-orange-200">
                <span className="text-orange-900 block text-[10px] uppercase font-bold">
                  Employee Cancellation Request Reason
                </span>
                <p className="text-orange-800 mt-0.5 font-medium">{leave.cancellationReason}</p>
              </div>
            )}

            {leave.attachmentOriginalName && (
              <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-xs text-corporate-700 font-medium">
                <FileText className="w-3.5 h-3.5 text-corporate-600" />
                <span className="truncate">{leave.attachmentOriginalName}</span>
              </div>
            )}
          </div>

          {/* Supervisor Decision Comments */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Comments (Mandatory if rejecting)
            </label>
            <textarea
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add supervisory notes..."
              className="w-full rounded-md border border-slate-200 p-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-corporate-600 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleActionSubmit("REJECTED")}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <span>✕</span>
                <span>{leave.status === "CANCELLATION_REQUESTED" ? "Decline Cancel" : "Reject"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleActionSubmit("APPROVED")}
                disabled={loading}
                className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-subtle transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <span>✓</span>
                <span>{leave.status === "CANCELLATION_REQUESTED" ? "Approve Cancel & Refund" : "Approve"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}