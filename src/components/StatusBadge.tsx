import React from "react";

interface StatusBadgeProps {
  status: "PENDING" | "MANAGER_APPROVED" | "APPROVED" | "REJECTED" | "CANCELLED" | "CANCELLATION_REQUESTED";
  className?: string;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, className = "", size = "md" }: StatusBadgeProps) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  switch (status) {
    case "APPROVED":
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70 transition-colors duration-150 ${sizeClasses} ${className}`}
        >
          <span className="font-bold text-[10px] leading-none">✓</span>
          <span>Approved</span>
        </span>
      );
    case "MANAGER_APPROVED":
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-medium bg-blue-50 text-corporate-700 border border-blue-200/70 transition-colors duration-150 ${sizeClasses} ${className}`}
        >
          <span className="font-bold text-[10px] leading-none">◷</span>
          <span>Endorsed</span>
        </span>
      );
    case "PENDING":
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-medium bg-amber-50 text-amber-700 border border-amber-200/70 transition-colors duration-150 ${sizeClasses} ${className}`}
        >
          <span className="font-bold text-[10px] leading-none animate-pulse">◷</span>
          <span>Pending</span>
        </span>
      );
    case "REJECTED":
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-medium bg-rose-50 text-rose-700 border border-rose-200/70 transition-colors duration-150 ${sizeClasses} ${className}`}
        >
          <span className="font-bold text-[10px] leading-none">✕</span>
          <span>Rejected</span>
        </span>
      );
    case "CANCELLED":
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-medium bg-slate-100 text-slate-600 border border-slate-200 transition-colors duration-150 ${sizeClasses} ${className}`}
        >
          <span className="font-bold text-[10px] leading-none">⊘</span>
          <span>Cancelled</span>
        </span>
      );
    case "CANCELLATION_REQUESTED":
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-medium bg-orange-50 text-orange-800 border border-orange-200/70 transition-colors duration-150 ${sizeClasses} ${className}`}
        >
          <span className="font-bold text-[10px] leading-none animate-pulse">⊘</span>
          <span>Cancel Req</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center rounded-md font-medium bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses} ${className}`}
        >
          {status}
        </span>
      );
  }
}