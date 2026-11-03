"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import {
  UserPlus,
  X,
  AlertCircle,
  Search,
  Edit2,
  History,
  CheckCircle2,
  Building2,
  Calendar,
  Shield,
  Clock,
  FileText,
} from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add User Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [employeeCode, setEmployeeCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password123!");
  const [roleName, setRoleName] = useState<"SUPER_ADMIN" | "HR_ADMIN" | "MANAGER" | "EMPLOYEE">("EMPLOYEE");
  const [departmentId, setDepartmentId] = useState("");
  const [managerId, setManagerId] = useState("");

  // Edit User Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [editRoleName, setEditRoleName] = useState<"SUPER_ADMIN" | "HR_ADMIN" | "MANAGER" | "EMPLOYEE">("EMPLOYEE");
  const [editManagerId, setEditManagerId] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "SUSPENDED" | "TERMINATED">("ACTIVE");

  // Employee Leave History Modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyUser, setHistoryUser] = useState<any>(null);
  const [historyLeaves, setHistoryLeaves] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, dRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/departments"),
      ]);
      if (uRes.ok) {
        const uData = await uRes.json();
        setUsers(uData.users || []);
      }
      if (dRes.ok) {
        const dData = await dRes.json();
        setDepartments(dData.departments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setModalLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeCode,
          firstName,
          lastName,
          email,
          password,
          roleName,
          departmentId: departmentId || null,
          managerId: managerId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to provision user.");
        setModalLoading(false);
        return;
      }

      setSuccess(`Employee ${firstName} ${lastName} (${employeeCode}) provisioned.`);
      setIsAddModalOpen(false);
      setEmployeeCode("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("Password123!");
      fetchData();
    } catch {
      setError("Network communication error.");
    } finally {
      setModalLoading(false);
    }
  };

  const openEditModal = (u: any) => {
    setEditingUser(u);
    setEditFirstName(u.firstName);
    setEditLastName(u.lastName);
    setEditDepartmentId(u.department?.id || "");
    setEditRoleName(u.role.name);
    setEditManagerId(u.manager?.id || "");
    setEditStatus(u.status || "ACTIVE");
    setError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setError(null);
    setModalLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser.id,
          firstName: editFirstName,
          lastName: editLastName,
          departmentId: editDepartmentId || null,
          roleName: editRoleName,
          managerId: editManagerId || null,
          status: editStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update employee account.");
        setModalLoading(false);
        return;
      }

      setSuccess(`Account for ${editFirstName} ${editLastName} updated.`);
      setIsEditModalOpen(false);
      fetchData();
    } catch {
      setError("Network communication error.");
    } finally {
      setModalLoading(false);
    }
  };

  const openHistoryModal = async (u: any) => {
    setHistoryUser(u);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);

    try {
      const res = await fetch(`/api/leaves?userId=${u.id}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryLeaves(data.leaves || []);
      } else {
        setHistoryLeaves([]);
      }
    } catch {
      setHistoryLeaves([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const managersList = users.filter(
    (u) => (u.role.name === "MANAGER" || u.role.name === "SUPER_ADMIN") && (!editingUser || u.id !== editingUser.id)
  );

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = `${u.firstName} ${u.lastName}`.toLowerCase().includes(q);
    const codeMatch = u.employeeCode.toLowerCase().includes(q);
    const emailMatch = u.email.toLowerCase().includes(q);
    const deptMatch = u.department?.name.toLowerCase().includes(q);
    return nameMatch || codeMatch || emailMatch || deptMatch;
  });

  const roleBadges: Record<string, string> = {
    SUPER_ADMIN: "bg-purple-50 text-purple-700 border-purple-200/70",
    HR_ADMIN: "bg-blue-50 text-corporate-700 border-blue-200/70",
    MANAGER: "bg-amber-50 text-amber-700 border-amber-200/70",
    EMPLOYEE: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <Header
        title="Employee Directory & Account Management"
        subtitle="Cavite State University - CEIT Personnel Roster"
        breadcrumbs={["Admin", "Employees"]}
      />

      <main className="flex-1 overflow-y-auto px-5 sm:px-8 pb-8 pt-4 space-y-4 animate-fade-in">
        {success && (
          <div className="p-3 rounded-md text-xs font-medium flex items-center justify-between border shadow-subtle bg-emerald-50 text-emerald-800 border-emerald-200 animate-slide-down">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {success}
            </span>
            <button onClick={() => setSuccess(null)} className="text-slate-400 hover:text-slate-600 ml-4 font-bold">
              ×
            </button>
          </div>
        )}

        {/* Directory Card */}
        <div className="bg-white rounded-lg border border-slate-200/70 shadow-subtle overflow-hidden">
          <div className="p-3.5 sm:px-5 border-b border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, code, dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 w-64 transition placeholder:text-slate-400"
              />
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-corporate-600 hover:bg-corporate-700 text-white text-xs font-semibold shadow-subtle hover:scale-105 active:scale-95 transition-all duration-150"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Employee</span>
            </button>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px] sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-5">Employee</th>
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Manager</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-center">History</th>
                  <th className="py-2.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400 font-medium">
                      Loading directory...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400 font-medium">
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="table-row-hover">
                      <td className="py-2.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {user.firstName} {user.lastName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-600">
                        {user.employeeCode}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {user.department?.name || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${roleBadges[user.role.name] || "bg-slate-100 text-slate-600"}`}>
                          {user.role.name}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {user.manager ? `${user.manager.firstName} ${user.manager.lastName}` : "—"}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {user.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>{user.status}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => openHistoryModal(user)}
                          className="px-2 py-0.5 text-[11px] font-medium rounded border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 shadow-subtle hover:scale-105 active:scale-95 transition-all"
                          title="View leave applications history"
                        >
                          <History className="w-3 h-3 text-corporate-600" />
                          <span>{user._count?.leaveRequests || 0}</span>
                        </button>
                      </td>
                      <td className="py-2.5 px-5 text-right">
                        <button
                          onClick={() => openEditModal(user)}
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

          {/* Mobile Stacked Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="text-center py-8 text-slate-400 font-medium text-xs">
                Loading directory...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-10 text-slate-400 font-medium text-xs">
                No employees found.
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="p-4 space-y-3 bg-white hover:bg-slate-50/70 transition-colors">
                  {/* Top: Avatar, Name, Role */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-300">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {user.employeeCode} • {user.email}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${roleBadges[user.role.name] || "bg-slate-100 text-slate-600"}`}>
                      {user.role.name}
                    </span>
                  </div>

                  {/* Middle: Department & Status */}
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <div>
                      <span className="text-[11px] text-slate-500">
                        {user.department?.name || "General"}
                      </span>
                      {user.manager && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Reports to: {user.manager.firstName} {user.manager.lastName}
                        </p>
                      )}
                    </div>
                    <div>
                      {user.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>{user.status}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom: History & Edit Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => openHistoryModal(user)}
                      className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 active:scale-95 transition-all"
                    >
                      <History className="w-3.5 h-3.5 text-corporate-600" />
                      <span>History ({user._count?.leaveRequests || 0})</span>
                    </button>
                    <button
                      onClick={() => openEditModal(user)}
                      className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-corporate-200 text-corporate-800 bg-corporate-50 hover:bg-corporate-100 active:scale-95 transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Account</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-5 py-2.5 border-t border-slate-200/70 bg-slate-50/70 text-[11px] text-slate-400 font-mono">
            {filteredUsers.length} active university accounts
          </div>
        </div>
      </main>

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-dropdown border border-slate-200 w-full max-w-md overflow-hidden animate-scale-in">
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70">
              <h3 className="text-sm font-bold text-slate-900">
                Provision Employee Account
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-6 h-6 rounded-md bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3">
              {error && (
                <div className="rounded-md bg-rose-50 p-2.5 text-xs font-medium text-rose-700 flex items-start gap-2 border border-rose-200 animate-slide-down">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                    placeholder="EMP-008"
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={roleName}
                    onChange={(e: any) => setRoleName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="HR_ADMIN">HR Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institutional Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                  >
                    <option value="">Unassigned</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Direct Manager
                  </label>
                  <select
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                  >
                    <option value="">None / Executive</option>
                    {managersList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} ({m.role.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Password
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                />
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
                  {modalLoading ? "Creating..." : "Provision Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-dropdown border border-slate-200 w-full max-w-md overflow-hidden animate-scale-in">
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-corporate-600" />
                <span>Edit Account: {editingUser.employeeCode}</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-6 h-6 rounded-md bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-5 space-y-3">
              {error && (
                <div className="rounded-md bg-rose-50 p-2.5 text-xs font-medium text-rose-700 flex items-start gap-2 border border-rose-200 animate-slide-down">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={editRoleName}
                    onChange={(e: any) => setEditRoleName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="HR_ADMIN">HR Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Status *
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="TERMINATED">Terminated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={editDepartmentId}
                    onChange={(e) => setEditDepartmentId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                  >
                    <option value="">Unassigned</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Direct Manager
                  </label>
                  <select
                    value={editManagerId}
                    onChange={(e) => setEditManagerId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                  >
                    <option value="">None / Executive</option>
                    {managersList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} ({m.role.name})
                      </option>
                    ))}
                  </select>
                </div>
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

      {/* Employee Leave History Modal */}
      {isHistoryModalOpen && historyUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-dropdown border border-slate-200 w-full max-w-2xl overflow-hidden animate-scale-in">
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-corporate-600" />
                  <span>Leave History: {historyUser.firstName} {historyUser.lastName}</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  {historyUser.employeeCode} • {historyUser.department?.name || "Unassigned"}
                </span>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-6 h-6 rounded-md bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {historyLoading ? (
                <div className="text-center py-8 text-xs text-slate-400 font-medium">
                  Loading employee leave records...
                </div>
              ) : historyLeaves.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 font-medium">
                  No leave requests filed yet by this employee.
                </div>
              ) : (
                <div className="space-y-3">
                  {historyLeaves.map((l) => (
                    <div
                      key={l.id}
                      className="p-3.5 rounded-lg border border-slate-200/70 bg-slate-50/50 hover:bg-white hover:border-corporate-200 transition-all duration-150 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {l.requestNumber}
                          </span>
                          <span className="text-xs font-semibold text-corporate-700">
                            • {l.leaveType.name}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            ({Number(l.totalDays)} {Number(l.totalDays) === 1 ? "day" : "days"})
                          </span>
                        </div>
                        <StatusBadge status={l.status} />
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          Filed: {new Date(l.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-200/60">
                        <span className="text-slate-400 font-medium">Reason:</span> {l.reason}
                      </div>

                      {l.approvals && l.approvals.length > 0 && (
                        <div className="pt-1.5 border-t border-slate-200/50 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">Remarks: </span>
                          {l.approvals[0]?.comments || "No comments recorded."}
                          <span className="text-slate-400 ml-1.5 font-mono">
                            (By {l.approvals[0]?.approver?.firstName} {l.approvals[0]?.approver?.lastName})
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-2.5 border-t border-slate-200/80 bg-slate-50/70 flex justify-end">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
