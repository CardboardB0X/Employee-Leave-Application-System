"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import {
  Printer,
  Download,
  Filter,
  Calendar,
  Building2,
  Tag,
  CheckCircle2,
  FileText,
  Clock,
  XCircle,
  RefreshCw,
} from "lucide-react";

export default function ReportsPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [aggregates, setAggregates] = useState<any>({
    totalRecords: 0,
    totalApprovedDays: 0,
    totalApproved: 0,
    totalPending: 0,
    totalRejected: 0,
  });
  const [departments, setDepartments] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const [generatedDate, setGeneratedDate] = useState<string>("");

  const fetchDropdowns = async () => {
    try {
      const [dRes, tRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/leave-types"),
      ]);
      if (dRes.ok) {
        const dData = await dRes.json();
        setDepartments(dData.departments || []);
      }
      if (tRes.ok) {
        const tData = await tRes.json();
        setLeaveTypes(tData.leaveTypes || []);
      }
    } catch {
      // Ignore
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (selectedDept !== "ALL") params.set("departmentId", selectedDept);
      if (selectedType !== "ALL") params.set("leaveTypeId", selectedType);
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeaves(data.leaves || []);
        setAggregates(
          data.aggregates || {
            totalRecords: 0,
            totalApprovedDays: 0,
            totalApproved: 0,
            totalPending: 0,
            totalRejected: 0,
          }
        );
        setGeneratedDate(
          new Intl.DateTimeFormat("en-US", {
            dateStyle: "full",
            timeStyle: "short",
          }).format(new Date())
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
    fetchReports();
  }, []);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (selectedStatus !== "ALL") params.set("status", selectedStatus);
    window.open(`/api/admin/export?${params.toString()}`, "_blank");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      {/* On-screen Portal Header (Hidden when printing) */}
      <div className="print:hidden">
        <Header
          title="Leave Reports & Analytics"
          subtitle="Cavite State University - CEIT Official Transactions"
          breadcrumbs={["Admin", "Reports"]}
        />
      </div>

      <main className="flex-1 overflow-y-auto px-5 sm:px-8 pb-8 pt-4 space-y-4 animate-fade-in print:p-0 print:m-0 print:overflow-visible">
        {/* Printable Official CvSU Institutional Header (Visible on print, also formatted on screen) */}
        <div className="hidden print:block mb-6 text-center border-b-2 border-slate-900 pb-4">
          <p className="text-xs uppercase font-serif tracking-widest text-slate-700">
            Republic of the Philippines
          </p>
          <h1 className="text-lg font-bold font-serif uppercase tracking-wide text-slate-900 mt-0.5">
            Cavite State University
          </h1>
          <p className="text-xs font-serif text-slate-600">
            Don Severino de las Alas Campus • Indang, Cavite • www.cvsu.edu.ph
          </p>
          <h2 className="text-sm font-semibold font-serif uppercase tracking-wider text-slate-800 mt-2">
            College of Engineering and Information Technology (CEIT)
          </h2>
          <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded mt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Official Employee Leave Transactions Report
            </h3>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">
            Generated on: {generatedDate}
          </p>
        </div>

        {/* Filter Controls Card (Hidden when printing) */}
        <div className="bg-white rounded-lg border border-slate-200/80 shadow-subtle p-4 print:hidden space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-corporate-600" />
              <h3 className="text-xs font-bold text-slate-900">
                Filter Leave Transactions
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-200 hover:bg-slate-50 text-slate-700 inline-flex items-center gap-1.5 shadow-subtle hover:scale-105 active:scale-95 transition-all"
                title="Download CSV Spreadsheet"
              >
                <Download className="w-3.5 h-3.5 text-corporate-600" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-1 text-xs font-semibold rounded bg-corporate-600 hover:bg-corporate-700 text-white inline-flex items-center gap-1.5 shadow-subtle hover:scale-105 active:scale-95 transition-all"
                title="Print or Save as Official PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Report</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Start Date (From)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                End Date (To)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Department
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Leave Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
              >
                <option value="ALL">All Categories</option>
                {leaveTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Status
              </label>
              <div className="flex gap-1.5">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PENDING">Pending</option>
                  <option value="MANAGER_APPROVED">Manager Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <button
                  onClick={fetchReports}
                  className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  title="Apply Filter"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Aggregated Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:grid-cols-4 print:gap-2">
          <div className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-subtle print:border-slate-300">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Total Transactions
            </span>
            <span className="text-xl font-extrabold text-slate-900 mt-1 block">
              {aggregates.totalRecords}
            </span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-subtle print:border-slate-300">
            <span className="text-[11px] font-semibold text-emerald-600 block uppercase tracking-wider">
              Approved Days
            </span>
            <span className="text-xl font-extrabold text-emerald-700 mt-1 block">
              {aggregates.totalApprovedDays} days
            </span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-subtle print:border-slate-300">
            <span className="text-[11px] font-semibold text-amber-600 block uppercase tracking-wider">
              Pending Applications
            </span>
            <span className="text-xl font-extrabold text-amber-700 mt-1 block">
              {aggregates.totalPending}
            </span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-subtle print:border-slate-300">
            <span className="text-[11px] font-semibold text-rose-600 block uppercase tracking-wider">
              Rejected Requests
            </span>
            <span className="text-xl font-extrabold text-rose-700 mt-1 block">
              {aggregates.totalRejected}
            </span>
          </div>
        </div>

        {/* Transaction Records Table */}
        <div className="bg-white rounded-lg border border-slate-200/80 shadow-subtle overflow-hidden print:border-slate-300 print:shadow-none">
          <div className="hidden md:block print:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px] print:bg-slate-100">
                <tr>
                  <th className="py-2.5 px-4">Ref #</th>
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-3">Dept</th>
                  <th className="py-2.5 px-3">Leave Type</th>
                  <th className="py-2.5 px-3">Dates</th>
                  <th className="py-2.5 px-2 text-center">Days</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4">Reason & Approver Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 print:divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400 font-medium">
                      Compiling leave report...
                    </td>
                  </tr>
                ) : leaves.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400 font-medium">
                      No leave records match the specified filters.
                    </td>
                  </tr>
                ) : (
                  leaves.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/60 print:hover:bg-transparent">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900 text-[11px]">
                        {l.requestNumber}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-semibold text-slate-900 block">
                          {l.user.firstName} {l.user.lastName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {l.user.employeeCode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {l.user.department?.code || l.user.department?.name || "—"}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {l.leaveType.name}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-600 whitespace-nowrap">
                        {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-slate-900">
                        {Number(l.totalDays)}
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={l.status} />
                      </td>
                      <td className="py-2.5 px-4 text-[11px]">
                        <p className="text-slate-800 font-medium line-clamp-1">{l.reason}</p>
                        {l.approvals && l.approvals[0]?.comments && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5 line-clamp-1">
                            Remarks: &quot;{l.approvals[0].comments}&quot;
                          </p>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View */}
          <div className="md:hidden divide-y divide-slate-100 print:hidden">
            {loading ? (
              <div className="text-center py-8 text-slate-400 font-medium text-xs">
                Compiling leave report...
              </div>
            ) : leaves.length === 0 ? (
              <div className="text-center py-10 text-slate-400 font-medium text-xs">
                No leave records match the specified filters.
              </div>
            ) : (
              leaves.map((l) => (
                <div key={l.id} className="p-4 space-y-2 bg-white hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-slate-900">{l.user.firstName} {l.user.lastName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{l.requestNumber} • {l.user.department?.name || "General"}</p>
                    </div>
                    <StatusBadge status={l.status} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <span className="font-medium text-slate-800">{l.leaveType.name}</span>
                    <span className="font-mono font-bold text-corporate-700 bg-corporate-50 px-2 py-0.5 rounded border border-corporate-200">
                      {Number(l.totalDays)} days
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400">
                    {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                  </p>
                  {l.reason && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                      &quot;{l.reason}&quot;
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-slate-200/70 bg-slate-50/70 text-[11px] text-slate-400 font-mono print:hidden">
            Showing {leaves.length} records
          </div>
        </div>

        {/* Printable Official Signatory Block (Visible on print) */}
        <div className="hidden print:block mt-12 pt-6 border-t border-slate-300">
          <div className="grid grid-cols-3 gap-8 text-center text-xs">
            <div>
              <p className="text-[11px] text-slate-500 mb-8 uppercase tracking-wider">
                Prepared by:
              </p>
              <div className="border-t border-slate-900 mx-4 pt-1 font-bold text-slate-900">
                HR Officer / Administrator
              </div>
              <p className="text-[10px] text-slate-500">Human Resources Office</p>
            </div>

            <div>
              <p className="text-[11px] text-slate-500 mb-8 uppercase tracking-wider">
                Certified Correct:
              </p>
              <div className="border-t border-slate-900 mx-4 pt-1 font-bold text-slate-900">
                Department Chairperson / Dean
              </div>
              <p className="text-[10px] text-slate-500">College of Engineering and Info Tech</p>
            </div>

            <div>
              <p className="text-[11px] text-slate-500 mb-8 uppercase tracking-wider">
                Approved by:
              </p>
              <div className="border-t border-slate-900 mx-4 pt-1 font-bold text-slate-900">
                Campus Administrator
              </div>
              <p className="text-[10px] text-slate-500">Cavite State University</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
