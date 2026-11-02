"use client";

import { useEffect, useState } from "react";
import { X, Printer, Loader2, FileCheck } from "lucide-react";

interface CscForm6ModalProps {
  leaveId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CscForm6Modal({
  leaveId,
  isOpen,
  onClose,
}: CscForm6ModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !leaveId) return;

    const fetchCscData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/leaves/${leaveId}/csc-form`);
        if (res.ok) {
          const resData = await res.json();
          setData(resData);
        } else {
          setError("Failed to load official CSC Form 6 data.");
        }
      } catch {
        setError("Network error while loading form.");
      } finally {
        setLoading(false);
      }
    };

    fetchCscData();
  }, [isOpen, leaveId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const leave = data?.leave;
  const balances = data?.balances;

  const isVacation = leave?.leaveType?.code === "VL";
  const isSick = leave?.leaveType?.code === "SL";
  const isEmergency = leave?.leaveType?.code === "EL";
  const isMaternity = leave?.leaveType?.code === "ML";
  const isPaternity = leave?.leaveType?.code === "PL";
  const isBereavement = leave?.leaveType?.code === "BL";

  const approver = leave?.approvals?.[0]?.approver;
  const approverNotes = leave?.approvals?.[0]?.comments;
  const isApproved = leave?.status === "APPROVED";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-scale-in print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none">
        {/* On-screen Header Bar (Hidden during print) */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold text-slate-900">
              Civil Service Commission (CSC) Form No. 6 — Revised 2020
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={loading || !!error}
              className="px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-subtle hover:scale-105 active:scale-95 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-0 print:overflow-visible text-slate-900 font-sans">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-corporate-600" />
              <span className="text-xs font-medium">Generating official CSC Form 6...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 text-rose-700 rounded text-xs text-center border border-rose-200">
              {error}
            </div>
          ) : leave ? (
            <div className="border-2 border-black p-4 sm:p-6 text-[11px] leading-tight space-y-3 bg-white">
              {/* Official CSC Header */}
              <div className="relative text-center border-b-2 border-black pb-3">
                <span className="absolute top-0 right-0 font-bold text-[9px] uppercase border border-black px-1.5 py-0.5">
                  CSC Form No. 6 (Revised 2020)
                </span>
                <p className="text-[10px] uppercase font-serif tracking-widest text-slate-700">
                  Republic of the Philippines
                </p>
                <h1 className="text-sm font-bold font-serif uppercase tracking-wider text-black mt-0.5">
                  CAVITE STATE UNIVERSITY
                </h1>
                <p className="text-[10px] font-serif text-slate-700">
                  Don Severino de las Alas Campus • Indang, Cavite
                </p>
                <p className="text-[10px] font-serif text-slate-800 font-semibold">
                  College of Engineering and Information Technology (CEIT)
                </p>
                <h2 className="text-base font-extrabold uppercase font-serif tracking-widest text-black mt-2 underline">
                  APPLICATION FOR LEAVE
                </h2>
              </div>

              {/* Box 1 to 5: Personal & Employment Details */}
              <div className="grid grid-cols-12 border border-black">
                <div className="col-span-12 sm:col-span-7 border-b sm:border-b-0 sm:border-r border-black p-2">
                  <span className="font-bold text-[10px] block text-slate-600">
                    1. OFFICE / DEPARTMENT
                  </span>
                  <span className="font-bold text-xs uppercase text-black">
                    Cavite State University — {leave.user.department?.name || "College of Engineering and Info Tech"}
                  </span>
                </div>
                <div className="col-span-12 sm:col-span-5 p-2">
                  <span className="font-bold text-[10px] block text-slate-600">
                    2. NAME (Last, First, Middle)
                  </span>
                  <span className="font-bold text-xs uppercase text-black">
                    {leave.user.lastName}, {leave.user.firstName}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 block">
                    Employee ID: {leave.user.employeeCode}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-12 border border-black border-t-0">
                <div className="col-span-4 border-r border-black p-2">
                  <span className="font-bold text-[10px] block text-slate-600">
                    3. DATE OF FILING
                  </span>
                  <span className="font-semibold text-xs text-black">
                    {new Date(leave.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="col-span-4 border-r border-black p-2">
                  <span className="font-bold text-[10px] block text-slate-600">
                    4. POSITION
                  </span>
                  <span className="font-semibold text-xs text-black">
                    {leave.user.role.name} / Academic Personnel
                  </span>
                </div>
                <div className="col-span-4 p-2">
                  <span className="font-bold text-[10px] block text-slate-600">
                    5. SALARY
                  </span>
                  <span className="font-semibold text-xs text-black">
                    Government Standard Scale
                  </span>
                </div>
              </div>

              {/* Section 6: Details of Application */}
              <div className="border border-black">
                <div className="bg-slate-100 border-b border-black px-2 py-1 font-bold text-xs uppercase tracking-wider text-center">
                  6. DETAILS OF APPLICATION
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-black">
                  {/* 6.A Type of Leave */}
                  <div className="p-2 space-y-1.5">
                    <span className="font-bold text-[10px] block text-slate-700 uppercase">
                      6.A TYPE OF LEAVE TO BE AVAILED OF
                    </span>
                    <div className="space-y-1 text-[10.5px]">
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" readOnly checked={isVacation} className="accent-black w-3.5 h-3.5" />
                        <span>Vacation Leave (Sec. 51, Rule XVI, Omnibus Rules)</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" readOnly checked={false} className="accent-black w-3.5 h-3.5" />
                        <span>Mandatory / Forced Leave (Sec. 25, Rule XVI)</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" readOnly checked={isSick} className="accent-black w-3.5 h-3.5" />
                        <span>Sick Leave (Sec. 43, Rule XVI, Omnibus Rules)</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" readOnly checked={isMaternity} className="accent-black w-3.5 h-3.5" />
                        <span>Maternity Leave (R.A. No. 11210 / 105-Day Law)</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" readOnly checked={isPaternity} className="accent-black w-3.5 h-3.5" />
                        <span>Paternity Leave (R.A. No. 8187 / 7 Working Days)</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" readOnly checked={isEmergency} className="accent-black w-3.5 h-3.5" />
                        <span>Special Privilege Leave (Rule XVI, Omnibus Rules)</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" readOnly checked={isBereavement} className="accent-black w-3.5 h-3.5" />
                        <span>Bereavement / Emergency Leave</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          readOnly
                          checked={!isVacation && !isSick && !isMaternity && !isPaternity && !isEmergency && !isBereavement}
                          className="accent-black w-3.5 h-3.5"
                        />
                        <span>Other Purpose: <u>{leave.leaveType.name}</u></span>
                      </label>
                    </div>
                  </div>

                  {/* 6.B Details of Leave */}
                  <div className="p-2 space-y-2">
                    <span className="font-bold text-[10px] block text-slate-700 uppercase">
                      6.B DETAILS OF LEAVE
                    </span>

                    {/* Vacation specific */}
                    <div className="border border-slate-300 p-1.5 rounded space-y-1">
                      <span className="font-semibold text-[10px] block text-slate-600">
                        In case of Vacation / Special Privilege Leave:
                      </span>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1">
                          <input type="checkbox" readOnly checked={isVacation} className="accent-black w-3 h-3" />
                          <span>Within the Philippines</span>
                        </label>
                        <label className="flex items-center gap-1">
                          <input type="checkbox" readOnly checked={false} className="accent-black w-3 h-3" />
                          <span>Abroad</span>
                        </label>
                      </div>
                    </div>

                    {/* Sick specific */}
                    <div className="border border-slate-300 p-1.5 rounded space-y-1">
                      <span className="font-semibold text-[10px] block text-slate-600">
                        In case of Sick Leave:
                      </span>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1">
                          <input type="checkbox" readOnly checked={false} className="accent-black w-3 h-3" />
                          <span>In Hospital</span>
                        </label>
                        <label className="flex items-center gap-1">
                          <input type="checkbox" readOnly checked={isSick} className="accent-black w-3 h-3" />
                          <span>Out Patient</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-[10px] block text-slate-600">
                        Specific Purpose / Illness:
                      </span>
                      <p className="border-b border-black text-slate-800 font-medium pb-0.5">
                        {leave.reason}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 6.C and 6.D */}
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-black border-t border-black">
                  <div className="p-2">
                    <span className="font-bold text-[10px] block text-slate-700 uppercase">
                      6.C NUMBER OF WORKING DAYS APPLIED FOR
                    </span>
                    <p className="text-xs font-bold text-black mt-1">
                      {Number(leave.totalDays)} {Number(leave.totalDays) === 1 ? "WORKING DAY" : "WORKING DAYS"}
                    </p>
                    <span className="font-semibold text-[10px] block text-slate-600 mt-1">
                      INCLUSIVE DATES:
                    </span>
                    <p className="font-bold text-xs text-black">
                      {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="p-2">
                    <span className="font-bold text-[10px] block text-slate-700 uppercase">
                      6.D COMMUTATION
                    </span>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-1">
                        <input type="checkbox" readOnly checked={false} className="accent-black w-3.5 h-3.5" />
                        <span>Requested</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="checkbox" readOnly checked={true} className="accent-black w-3.5 h-3.5" />
                        <span className="font-semibold">Not Requested</span>
                      </label>
                    </div>
                    <div className="mt-4 pt-4 border-t border-dashed border-black text-center">
                      <span className="font-bold text-xs uppercase block">
                        {leave.user.firstName} {leave.user.lastName}
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase">
                        (Signature of Applicant)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 7: Details of Action on Application */}
              <div className="border border-black">
                <div className="bg-slate-100 border-b border-black px-2 py-1 font-bold text-xs uppercase tracking-wider text-center">
                  7. DETAILS OF ACTION ON APPLICATION
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-black">
                  {/* 7.A Certification of Leave Credits */}
                  <div className="p-2 space-y-2">
                    <span className="font-bold text-[10px] block text-slate-700 uppercase">
                      7.A CERTIFICATION OF LEAVE CREDITS
                    </span>
                    <p className="text-[10px] text-slate-500">
                      As of {new Date().toLocaleDateString()}:
                    </p>

                    <table className="w-full text-center border-collapse border border-black text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-black">
                          <th className="border-r border-black p-1">Category</th>
                          <th className="border-r border-black p-1">Vacation (VL)</th>
                          <th className="p-1">Sick (SL)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-black">
                          <td className="border-r border-black p-1 font-semibold text-left">Total Earned</td>
                          <td className="border-r border-black p-1 font-mono">{balances?.vacation?.total || 15}</td>
                          <td className="p-1 font-mono">{balances?.sick?.total || 15}</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="border-r border-black p-1 font-semibold text-left">Less this App</td>
                          <td className="border-r border-black p-1 font-mono">{isVacation ? Number(leave.totalDays) : 0}</td>
                          <td className="p-1 font-mono">{isSick ? Number(leave.totalDays) : 0}</td>
                        </tr>
                        <tr className="font-bold bg-slate-50">
                          <td className="border-r border-black p-1 text-left">Balance</td>
                          <td className="border-r border-black p-1 font-mono">{balances?.vacation?.remaining || 15}</td>
                          <td className="p-1 font-mono">{balances?.sick?.remaining || 15}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="mt-4 pt-3 text-center">
                      <span className="font-bold text-xs uppercase block text-black">
                        EMMANUEL CREO
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase block">
                        Authorized HR Officer / Administrative Officer
                      </span>
                    </div>
                  </div>

                  {/* 7.B Recommendation */}
                  <div className="p-2 space-y-2">
                    <span className="font-bold text-[10px] block text-slate-700 uppercase">
                      7.B RECOMMENDATION
                    </span>

                    <div className="space-y-1.5 mt-2">
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          readOnly
                          checked={isApproved || leave.status === "MANAGER_APPROVED"}
                          className="accent-black w-3.5 h-3.5"
                        />
                        <span className="font-semibold">Approval</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          readOnly
                          checked={leave.status === "REJECTED"}
                          className="accent-black w-3.5 h-3.5"
                        />
                        <span>Disapproval due to: <u>{approverNotes || "______________________"}</u></span>
                      </label>
                    </div>

                    <div className="mt-8 pt-6 text-center">
                      <span className="font-bold text-xs uppercase block text-black">
                        {approver ? `${approver.firstName} ${approver.lastName}` : "GABRIELLE RED JECIEL"}
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase block">
                        Department Chairperson / Direct Supervisor
                      </span>
                    </div>
                  </div>
                </div>

                {/* 7.C & 7.D Approval / Disapproval Block */}
                <div className="border-t border-black p-3 space-y-2">
                  <span className="font-bold text-[10px] block text-slate-700 uppercase">
                    7.C APPROVED FOR:
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-[10.5px]">
                    <div>
                      <span>[ {isApproved ? "✓" : " "} ] {isApproved ? Number(leave.totalDays) : "___"} days with pay</span>
                    </div>
                    <div>
                      <span>[   ] ___ days without pay</span>
                    </div>
                    <div>
                      <span>[ {leave.status === "REJECTED" ? "✓" : " "} ] Disapproved</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 text-center">
                    <span className="font-bold text-xs uppercase block text-black">
                      ADRIAN SANCHEZ
                    </span>
                    <span className="text-[9px] text-slate-600 uppercase font-semibold block">
                      Campus Administrator / Authorized Official
                    </span>
                    <span className="text-[9px] text-slate-400 block">
                      Cavite State University
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
