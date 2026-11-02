"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { RefreshCw, Search, Terminal, X, Download } from "lucide-react";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = actionFilter !== "ALL" ? `/api/admin/audit-logs?action=${actionFilter}` : "/api/admin/audit-logs";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const actionMatch = log.action.toLowerCase().includes(q);
    const actorMatch = log.actor ? `${log.actor.firstName} ${log.actor.lastName} ${log.actor.email}`.toLowerCase().includes(q) : false;
    const ipMatch = log.ipAddress?.includes(q);
    return actionMatch || actorMatch || ipMatch;
  });

  const getActionBadge = (action: string) => {
    if (action.includes("FAILED") || action.includes("LOCKOUT")) {
      return "bg-rose-50 text-rose-700 border-rose-200/70";
    }
    if (action.includes("APPROVED")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200/70";
    }
    if (action.includes("REJECTED")) {
      return "bg-amber-50 text-amber-700 border-amber-200/70";
    }
    if (action.includes("LOGIN")) {
      return "bg-blue-50 text-corporate-700 border-blue-200/70";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <Header
        title="Audit Logs"
        subtitle="Security ledger tracking authentication and leave changes"
        breadcrumbs={["Admin", "Audit Logs"]}
      />

      <main className="flex-1 overflow-y-auto px-5 sm:px-8 pb-6 pt-4 space-y-4 animate-fade-in">
        {/* Controls Toolbar */}
        <div className="bg-white rounded-lg border border-slate-200/70 shadow-subtle p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Segmented Filter */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md overflow-x-auto">
            {["ALL", "LOGIN", "LEAVE", "BALANCE", "USER"].map((act) => (
              <button
                key={act}
                onClick={() => setActionFilter(act)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-all duration-150 whitespace-nowrap ${
                  actionFilter === act
                    ? "bg-white text-slate-900 shadow-subtle font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {act === "ALL" ? "All" : act}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/admin/audit-logs/export"
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-md shadow-subtle hover:scale-105 active:scale-95 transition-all"
              title="Download Security Audit Trail (CSV)"
            >
              <Download className="w-3.5 h-3.5 text-corporate-600" />
              <span>Export CSV</span>
            </a>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search actor, action, IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-2.5 py-1 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 w-52 sm:w-60 transition placeholder:text-slate-400"
              />
            </div>

            <button
              onClick={fetchLogs}
              className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all duration-150 hover:scale-105 active:scale-95 group"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-300 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Audit Table */}
        <div className="bg-white rounded-lg border border-slate-200/70 shadow-subtle overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200/70 flex items-center justify-between bg-white">
            <span className="text-sm font-bold text-slate-900">
              Audit Ledger
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {filteredLogs.length} events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-5">Timestamp</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">IP Address</th>
                  <th className="py-2.5 px-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">
                      Loading audit records...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400 font-medium">
                      No security audit events match this criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="table-row-hover font-mono text-[11px]">
                      <td className="py-2.5 px-5 text-slate-500">
                        {new Date(log.createdAt).toISOString().replace("T", " ").substring(0, 19)}
                      </td>
                      <td className="py-2.5 px-4 font-sans font-medium text-slate-900">
                        {log.actor ? (
                          <span>
                            {log.actor.firstName} {log.actor.lastName}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[10px]">ANONYMOUS</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-semibold border ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {log.ipAddress || "127.0.0.1"}
                      </td>
                      <td className="py-2.5 px-5 text-right">
                        {log.details ? (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-sans font-medium text-corporate-700 bg-corporate-50 hover:bg-corporate-100 rounded border border-corporate-200 transition-all duration-150 hover:scale-105 active:scale-95"
                          >
                            <Terminal className="w-3 h-3" />
                            <span>Payload</span>
                          </button>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-2 border-t border-slate-200/70 bg-slate-50/70 text-[11px] text-slate-400 font-mono">
            Immutable Chain Verified
          </div>
        </div>
      </main>

      {/* JSON Payload Inspector Dialog */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-dropdown border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Audit Payload
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {selectedLog.action} • {selectedLog.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-6 h-6 rounded-md bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <pre className="p-3 rounded-md bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-64 leading-relaxed">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>

              <div className="pt-2 border-t border-slate-200/80 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}