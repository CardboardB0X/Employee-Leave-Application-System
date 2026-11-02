"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import {
  Tag,
  Plus,
  Edit2,
  X,
  AlertCircle,
  CheckCircle2,
  Paperclip,
  Check,
  Search,
  DollarSign,
  ShieldAlert,
} from "lucide-react";

export default function LeaveTypesPage() {
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<any>(null);

  // Form states for Add / Edit
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [defaultAnnualDays, setDefaultAnnualDays] = useState<number>(15);
  const [requiresAttachment, setRequiresAttachment] = useState(false);
  const [requiresHrApproval, setRequiresHrApproval] = useState(false);
  const [isPaid, setIsPaid] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/leave-types?all=true");
      if (res.ok) {
        const data = await res.json();
        setLeaveTypes(data.leaveTypes || []);
      }
    } catch {
      setError("Failed to fetch leave types.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const openAddModal = () => {
    setName("");
    setCode("");
    setDescription("");
    setDefaultAnnualDays(15);
    setRequiresAttachment(false);
    setRequiresHrApproval(false);
    setIsPaid(true);
    setIsActive(true);
    setError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (lt: any) => {
    setSelectedType(lt);
    setName(lt.name);
    setCode(lt.code);
    setDescription(lt.description || "");
    setDefaultAnnualDays(Number(lt.defaultAnnualDays));
    setRequiresAttachment(lt.requiresAttachment);
    setRequiresHrApproval(lt.requiresHrApproval);
    setIsPaid(lt.isPaid);
    setIsActive(lt.isActive);
    setError(null);
    setIsEditModalOpen(true);
  };

  const handleCreateLeaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/leave-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code,
          description: description || null,
          defaultAnnualDays: Number(defaultAnnualDays),
          requiresAttachment,
          requiresHrApproval,
          isPaid,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create leave type.");
      } else {
        setSuccess(`Leave type '${name}' (${code}) successfully registered.`);
        setIsAddModalOpen(false);
        fetchLeaveTypes();
      }
    } catch {
      setError("Network communication error.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateLeaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;
    setModalLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/leave-types", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedType.id,
          name,
          description: description || null,
          defaultAnnualDays: Number(defaultAnnualDays),
          requiresAttachment,
          requiresHrApproval,
          isPaid,
          isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update leave type.");
      } else {
        setSuccess(`Leave type '${name}' updated successfully.`);
        setIsEditModalOpen(false);
        fetchLeaveTypes();
      }
    } catch {
      setError("Network communication error.");
    } finally {
      setModalLoading(false);
    }
  };

  const filteredLeaveTypes = leaveTypes.filter((lt) => {
    const q = searchQuery.toLowerCase();
    return (
      lt.name.toLowerCase().includes(q) ||
      lt.code.toLowerCase().includes(q) ||
      (lt.description && lt.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <Header
        title="Leave Types Management"
        subtitle="Configure institution leave categories and statutory policies"
        breadcrumbs={["Admin", "Leave Types"]}
      />

      <main className="flex-1 overflow-y-auto px-5 sm:px-8 pb-8 pt-4 space-y-4 animate-fade-in">
        {success && (
          <div className="p-3 rounded-md text-xs font-medium flex items-center justify-between border shadow-subtle bg-emerald-50 text-emerald-800 border-emerald-200 animate-slide-down">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {success}
            </span>
            <button
              onClick={() => setSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
            >
              ×
            </button>
          </div>
        )}

        {/* Action Header Card */}
        <div className="bg-white rounded-lg border border-slate-200/70 shadow-subtle overflow-hidden">
          <div className="p-3.5 sm:px-5 border-b border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search leave types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 w-64 transition placeholder:text-slate-400"
              />
            </div>

            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-corporate-600 hover:bg-corporate-700 text-white text-xs font-semibold shadow-subtle hover:scale-105 active:scale-95 transition-all duration-150"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Leave Type</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-5">Leave Category</th>
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4 text-center">Annual Quota</th>
                  <th className="py-2.5 px-4 text-center">Attachment</th>
                  <th className="py-2.5 px-4 text-center">HR Stage</th>
                  <th className="py-2.5 px-4 text-center">Compensation</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400 font-medium">
                      Loading leave types...
                    </td>
                  </tr>
                ) : filteredLeaveTypes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400 font-medium">
                      No leave types found.
                    </td>
                  </tr>
                ) : (
                  filteredLeaveTypes.map((lt) => (
                    <tr key={lt.id} className="table-row-hover">
                      <td className="py-3 px-5">
                        <div>
                          <span className="font-semibold text-slate-900 block">
                            {lt.name}
                          </span>
                          {lt.description && (
                            <span className="text-[11px] text-slate-400 line-clamp-1">
                              {lt.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {lt.code}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-corporate-700">
                        {Number(lt.defaultAnnualDays)} days
                      </td>
                      <td className="py-3 px-4 text-center">
                        {lt.requiresAttachment ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/70">
                            <Paperclip className="w-3 h-3" /> Required
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Optional</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {lt.requiresHrApproval ? (
                          <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/70">
                            2-Stage (Mgr+HR)
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">1-Stage (Mgr)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {lt.isPaid ? (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Paid
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            Unpaid
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {lt.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => openEditModal(lt)}
                          className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 shadow-subtle hover:scale-105 active:scale-95 transition-all"
                        >
                          <Edit2 className="w-3 h-3 text-slate-400" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-2.5 border-t border-slate-200/70 bg-slate-50/70 text-[11px] text-slate-400 font-mono">
            {filteredLeaveTypes.length} configured leave categories
          </div>
        </div>
      </main>

      {/* Add Leave Type Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-dropdown border border-slate-200 w-full max-w-md overflow-hidden animate-scale-in">
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-corporate-600" />
                <span>Add New Leave Type</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-6 h-6 rounded-md bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleCreateLeaveType} className="p-5 space-y-3.5">
              {error && (
                <div className="rounded-md bg-rose-50 p-2.5 text-xs font-medium text-rose-700 flex items-start gap-2 border border-rose-200 animate-slide-down">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Leave Type Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Study Leave"
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="STL"
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Annual Quota (Days) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  step="0.5"
                  required
                  value={defaultAnnualDays}
                  onChange={(e) => setDefaultAnnualDays(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Institutional Policy
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Eligibility requirements, supporting proof guidelines..."
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={requiresAttachment}
                    onChange={(e) => setRequiresAttachment(e.target.checked)}
                    className="rounded border-slate-300 text-corporate-600 focus:ring-corporate-500"
                  />
                  <span>Mandatory Supporting Document (e.g., Medical Certificate)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={requiresHrApproval}
                    onChange={(e) => setRequiresHrApproval(e.target.checked)}
                    className="rounded border-slate-300 text-corporate-600 focus:ring-corporate-500"
                  />
                  <span>Require 2-Stage Approval (Department Manager + HR Admin)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className="rounded border-slate-300 text-corporate-600 focus:ring-corporate-500"
                  />
                  <span>Paid Leave Entitlement</span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-1.5 rounded-md bg-corporate-600 hover:bg-corporate-700 text-white text-xs font-semibold shadow-subtle hover:scale-105 active:scale-95 transition-all duration-150 disabled:opacity-50"
                >
                  {modalLoading ? "Creating..." : "Create Leave Type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Leave Type Modal */}
      {isEditModalOpen && selectedType && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-dropdown border border-slate-200 w-full max-w-md overflow-hidden animate-scale-in">
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-corporate-600" />
                <span>Edit Leave Type: {selectedType.name}</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-6 h-6 rounded-md bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleUpdateLeaveType} className="p-5 space-y-3.5">
              {error && (
                <div className="rounded-md bg-rose-50 p-2.5 text-xs font-medium text-rose-700 flex items-start gap-2 border border-rose-200 animate-slide-down">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Leave Type Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Annual Quota (Days) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  step="0.5"
                  required
                  value={defaultAnnualDays}
                  onChange={(e) => setDefaultAnnualDays(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Institutional Policy
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={requiresAttachment}
                    onChange={(e) => setRequiresAttachment(e.target.checked)}
                    className="rounded border-slate-300 text-corporate-600 focus:ring-corporate-500"
                  />
                  <span>Mandatory Supporting Document</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={requiresHrApproval}
                    onChange={(e) => setRequiresHrApproval(e.target.checked)}
                    className="rounded border-slate-300 text-corporate-600 focus:ring-corporate-500"
                  />
                  <span>Require 2-Stage Approval (Manager + HR)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className="rounded border-slate-300 text-corporate-600 focus:ring-corporate-500"
                  />
                  <span>Paid Leave Entitlement</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-slate-300 text-corporate-600 focus:ring-corporate-500"
                  />
                  <span>Active Category (available for application)</span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-1.5 rounded-md bg-corporate-600 hover:bg-corporate-700 text-white text-xs font-semibold shadow-subtle hover:scale-105 active:scale-95 transition-all duration-150 disabled:opacity-50"
                >
                  {modalLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
