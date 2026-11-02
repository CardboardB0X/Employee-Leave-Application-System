"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Edit3, X, AlertCircle } from "lucide-react";

export default function BalancesPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBalance, setEditingBalance] = useState<any | null>(null);
  const [newAllocated, setNewAllocated] = useState<number>(0);
  const [newCarried, setNewCarried] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>("");
  const [modalLoading, setModalLoading] = useState(false);
  const [accrualLoading, setAccrualLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRunMonthlyAccrual = async () => {
    const currentMonth = new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date());
    if (
      !confirm(
        `Execute statutory monthly leave accrual for ${currentMonth}?\n\nThis will credit +1.25 days Vacation Leave and +1.25 days Sick Leave to all active university personnel.`
      )
    )
      return;

    try {
      setAccrualLoading(true);
      const res = await fetch("/api/balances/accrue", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to process monthly accrual.");
      } else {
        setSuccessMsg(data.message);
        if (selectedUserId) {
          fetchBalances(selectedUserId);
        }
      }
    } catch {
      alert("Network communication error.");
    } finally {
      setAccrualLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        if (data.users?.length > 0 && !selectedUserId) {
          setSelectedUserId(data.users[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBalances = async (userId: string) => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/balances?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setBalances(data.balances || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchBalances(selectedUserId);
    }
  }, [selectedUserId]);

  const handleOpenEdit = (bal: any) => {
    setEditingBalance(bal);
    setNewAllocated(Number(bal.totalAllocated));
    setNewCarried(Number(bal.carriedOver));
    setAdjustReason("");
    setModalError(null);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustReason || adjustReason.trim().length < 5) {
      setModalError("Please provide an adjustment reason with at least 5 characters.");
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      const res = await fetch("/api/balances", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          balanceId: editingBalance.id,
          totalAllocated: Number(newAllocated),
          carriedOver: Number(newCarried),
          reason: adjustReason.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setModalError(data.error || "Failed to update balance.");
        setModalLoading(false);
        return;
      }

      setSuccessMsg("Quota adjustment recorded in audit trail.");
      setEditingBalance(null);
      fetchBalances(selectedUserId);
    } catch {
      setModalError("Network communication error.");
    } finally {
      setModalLoading(false);
    }
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <Header
        title="Leave Quotas"
        subtitle="Annual entitlements and carried forward balances"
        breadcrumbs={["Supervisory", "Quotas"]}
      />

      <main className="flex-1 overflow-y-auto px-5 sm:px-8 pb-6 pt-4 space-y-4 animate-fade-in">
        {successMsg && (
          <div className="p-3 rounded-md text-xs font-medium flex items-center justify-between border shadow-subtle bg-emerald-50 text-emerald-800 border-emerald-200 animate-slide-down">
            <span className="flex items-center gap-1.5">
              <span className="font-bold">✓</span>
              {successMsg}
            </span>
            <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-slate-600 ml-4 font-bold">
              ×
            </button>
          </div>
        )}

        {/* User Picker Bar */}
        <div className="bg-white rounded-lg border border-slate-200/70 shadow-subtle p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
              Employee:
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="text-xs rounded-md border border-slate-200 px-2.5 py-1.5 bg-white text-slate-900 focus:outline-none focus:border-corporate-600 font-medium min-w-[240px]"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.employeeCode})
                </option>
              ))}
            </select>
          </div>

          {selectedUser && (
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              <span>{selectedUser.department?.name || "General"}</span>
              <span className="text-slate-300">•</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                {selectedUser.role?.name}
              </span>
              <button
                onClick={handleRunMonthlyAccrual}
                disabled={accrualLoading}
                className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold shadow-subtle hover:scale-105 active:scale-95 transition-all duration-150"
                title="Credit statutory 1.25 VL & 1.25 SL monthly allocation"
              >
                <span>⚡</span>
                <span>{accrualLoading ? "Accruing..." : "Run Monthly Accrual (+1.25 VL/SL)"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Quotas Table */}
        <div className="bg-white rounded-lg border border-slate-200/70 shadow-subtle overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200/70 flex items-center justify-between bg-white">
            <h3 className="text-sm font-bold text-slate-900">
              Allocated Quotas (2026)
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              {balances.length} categories
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-5">Category</th>
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Allocated</th>
                  <th className="py-2.5 px-4">Carried</th>
                  <th className="py-2.5 px-4">Used</th>
                  <th className="py-2.5 px-4">Pending</th>
                  <th className="py-2.5 px-4">Available</th>
                  <th className="py-2.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400 font-medium">
                      Loading quotas...
                    </td>
                  </tr>
                ) : balances.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400 font-medium">
                      No quota records found.
                    </td>
                  </tr>
                ) : (
                  balances.map((bal) => {
                    const allocated = Number(bal.totalAllocated);
                    const carried = Number(bal.carriedOver);
                    const used = Number(bal.usedDays);
                    const pending = Number(bal.pendingDays);
                    const available = allocated + carried - used - pending;

                    return (
                      <tr key={bal.id} className="table-row-hover">
                        <td className="py-3 px-5 font-semibold text-slate-900">
                          {bal.leaveType?.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                          {bal.leaveType?.code}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {allocated.toFixed(1)} d
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {carried.toFixed(1)} d
                        </td>
                        <td className="py-3 px-4 text-rose-600 font-medium">
                          {used.toFixed(1)} d
                        </td>
                        <td className="py-3 px-4 text-amber-600 font-medium">
                          {pending.toFixed(1)} d
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                            available > 0
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {available.toFixed(1)} d
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right">
                          <button
                            onClick={() => handleOpenEdit(bal)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-corporate-700 bg-corporate-50 hover:bg-corporate-100 rounded border border-corporate-200 transition-all duration-150 hover:scale-105 active:scale-95"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Adjust</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Adjustment Dialog */}
      {editingBalance && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-dropdown border border-slate-200 w-full max-w-sm overflow-hidden animate-scale-in">
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Adjust Quota
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {editingBalance.leaveType?.name}
                </p>
              </div>
              <button
                onClick={() => setEditingBalance(null)}
                className="w-6 h-6 rounded-md bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-5 space-y-3.5">
              {modalError && (
                <div className="rounded-md bg-rose-50 p-2.5 text-xs font-medium text-rose-700 flex items-start gap-2 border border-rose-200 animate-slide-down">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Annual Days
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={newAllocated}
                    onChange={(e) => setNewAllocated(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 bg-white focus:outline-none focus:border-corporate-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Carried Days
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={newCarried}
                    onChange={(e) => setNewCarried(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 bg-white focus:outline-none focus:border-corporate-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Adjustment
                </label>
                <textarea
                  rows={2}
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="State reason for audit trail..."
                  className="w-full rounded-md border border-slate-200 p-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-corporate-600 resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBalance(null)}
                  disabled={modalLoading}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-corporate-600 hover:bg-corporate-700 rounded-md shadow-subtle hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {modalLoading ? "Saving..." : "Save Quota"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}