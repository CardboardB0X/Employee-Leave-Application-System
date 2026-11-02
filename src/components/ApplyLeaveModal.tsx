"use client";

import { useEffect, useState } from "react";
import {
  X,
  Calendar,
  AlertCircle,
  FileText,
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Paperclip,
} from "lucide-react";
import { format } from "date-fns";
import { calculateWorkingDays } from "@/lib/leave-calculator";

interface LeaveType {
  id: string;
  name: string;
  code: string;
  defaultAnnualDays: number;
  requiresAttachment: boolean;
  requiresHrApproval: boolean;
  isPaid: boolean;
}

interface LeaveBalance {
  leaveTypeId: string;
  totalAllocated: string | number;
  usedDays: string | number;
  pendingDays: string | number;
  carriedOver: string | number;
}

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leaveTypes: LeaveType[];
  balances: LeaveBalance[];
}

export default function ApplyLeaveModal({
  isOpen,
  onClose,
  onSuccess,
  leaveTypes,
  balances,
}: ApplyLeaveModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isHalfDay, setIsHalfDay] = useState<boolean>(false);
  const [halfDayType, setHalfDayType] = useState<"FIRST_HALF" | "SECOND_HALF">("FIRST_HALF");
  const [reason, setReason] = useState<string>("");
  const [holidays, setHolidays] = useState<any[]>([]);

  // File upload state
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentOriginalName, setAttachmentOriginalName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await fetch("/api/holidays");
        if (res.ok) {
          const data = await res.json();
          setHolidays(data.holidays || []);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchHolidays();
  }, []);

  useEffect(() => {
    if (leaveTypes.length > 0 && !selectedTypeId) {
      setSelectedTypeId(leaveTypes[0].id);
    }
  }, [leaveTypes, selectedTypeId]);

  if (!isOpen) return null;

  const currentType = leaveTypes.find((lt) => lt.id === selectedTypeId);

  const currentBalance = balances.find((b) => b.leaveTypeId === selectedTypeId);
  const allocated = Number(currentBalance?.totalAllocated || 0);
  const carried = Number(currentBalance?.carriedOver || 0);
  const used = Number(currentBalance?.usedDays || 0);
  const pending = Number(currentBalance?.pendingDays || 0);
  const availableDays = allocated + carried - used - pending;

  const holidayDateStrings = holidays.map((h) => format(new Date(h.date), "yyyy-MM-dd"));

  let calcResult = { totalDays: 0, holidaysCount: 0, weekendsCount: 0 };
  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (s <= e) {
      calcResult = calculateWorkingDays(s, e, isHalfDay, holidayDateStrings);
    }
  }

  const isInsufficient = currentType?.isPaid && calcResult.totalDays > availableDays;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "File upload failed.");
      } else {
        setAttachmentUrl(data.url);
        setAttachmentOriginalName(data.originalName);
      }
    } catch {
      setError("File upload error.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedTypeId) {
      setError("Please choose a leave category.");
      return;
    }
    if (!startDate) {
      setError("Please specify a start date.");
      return;
    }
    if (!isHalfDay && !endDate) {
      setError("Please specify an end date.");
      return;
    }
    if (calcResult.totalDays <= 0) {
      setError("The selected range has 0 working days (dates fall on weekends or public holidays).");
      return;
    }
    if (isInsufficient) {
      setError(`Insufficient leave quota. You only have ${availableDays} day(s) available.`);
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason || reason.trim().length < 5) {
      setError("Please provide a constructive reason (at least 5 characters).");
      return;
    }

    if (currentType?.requiresAttachment && calcResult.totalDays >= 2 && !attachmentUrl) {
      setError(`${currentType.name} requires supporting documentation.`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveTypeId: selectedTypeId,
          startDate,
          endDate: isHalfDay ? startDate : endDate,
          isHalfDay,
          halfDayType: isHalfDay ? halfDayType : undefined,
          reason,
          attachmentPath: attachmentUrl,
          attachmentOriginalName: attachmentOriginalName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit request.");
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-dropdown border border-slate-200/90 w-full max-w-lg overflow-hidden animate-scale-in">
        {/* Header & Stepper */}
        <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/70">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Apply for Leave
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Cavite State University — CEIT Leave Application
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Outcrowd 2-Step Pill Stepper */}
          <div className="flex items-center gap-2">
            <div
              className={`flex-1 flex items-center gap-2 py-1 px-3 rounded-lg text-xs font-semibold transition-all ${
                step === 1
                  ? "bg-corporate-600 text-white shadow-subtle"
                  : "bg-slate-200/60 text-slate-600 cursor-pointer"
              }`}
              onClick={() => setStep(1)}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4">
                1
              </span>
              <span>Category & Dates</span>
            </div>

            <div
              className={`flex-1 flex items-center gap-2 py-1 px-3 rounded-lg text-xs font-semibold transition-all ${
                step === 2
                  ? "bg-corporate-600 text-white shadow-subtle"
                  : "bg-slate-200/60 text-slate-400"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4">
                2
              </span>
              <span>Reason & Proof</span>
            </div>
          </div>
        </div>

        {/* Modal Form */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 flex items-start gap-2 border border-rose-200 animate-slide-down">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4 animate-fade-in">
              {/* Category Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Select Leave Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {leaveTypes.map((lt) => {
                    const bal = balances.find((b) => b.leaveTypeId === lt.id);
                    const avail =
                      Number(bal?.totalAllocated || 0) +
                      Number(bal?.carriedOver || 0) -
                      Number(bal?.usedDays || 0) -
                      Number(bal?.pendingDays || 0);
                    const isSelected = selectedTypeId === lt.id;

                    return (
                      <button
                        key={lt.id}
                        type="button"
                        onClick={() => setSelectedTypeId(lt.id)}
                        className={`p-3 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between ${
                          isSelected
                            ? "border-corporate-600 bg-corporate-50/70 ring-1 ring-corporate-600 shadow-subtle"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white"
                        }`}
                      >
                        <span className="font-bold text-xs text-slate-900 truncate block">
                          {lt.name}
                        </span>
                        <div className="flex items-center justify-between text-[11px] mt-2">
                          <span className="text-slate-400 font-mono text-[10px] font-bold">
                            {lt.code}
                          </span>
                          <span
                            className={`font-bold font-mono text-xs ${
                              lt.isPaid ? "text-corporate-700" : "text-slate-400"
                            }`}
                          >
                            {lt.isPaid ? `${avail}d` : "Unpaid"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Half-Day Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/90 border border-slate-200/80">
                <div>
                  <p className="text-xs font-bold text-slate-800">Half-Day Leave</p>
                  <p className="text-[11px] text-slate-400">0.5-day shift deduction</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHalfDay}
                    onChange={(e) => {
                      setIsHalfDay(e.target.checked);
                      if (e.target.checked && startDate) setEndDate(startDate);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-corporate-600"></div>
                </label>
              </div>

              {isHalfDay && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHalfDayType("FIRST_HALF")}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      halfDayType === "FIRST_HALF"
                        ? "bg-corporate-50 border-corporate-300 text-corporate-800"
                        : "border-slate-200 text-slate-600 bg-white"
                    }`}
                  >
                    Morning Shift (1st Half)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHalfDayType("SECOND_HALF")}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      halfDayType === "SECOND_HALF"
                        ? "bg-corporate-50 border-corporate-300 text-corporate-800"
                        : "border-slate-200 text-slate-600 bg-white"
                    }`}
                  >
                    Afternoon Shift (2nd Half)
                  </button>
                </div>
              )}

              {/* Date Pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Start Date *
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (isHalfDay || !endDate) setEndDate(e.target.value);
                      }}
                      className="w-full pl-8 pr-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    End Date *
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="date"
                      required
                      disabled={isHalfDay}
                      value={isHalfDay ? startDate : endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 transition disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Live Working Days Calculation Pill */}
              {startDate && (
                <div className="p-3 bg-corporate-50/80 border border-corporate-200 rounded-xl flex items-center justify-between text-xs animate-slide-down">
                  <div>
                    <span className="font-black text-corporate-900 block text-xs">
                      {calcResult.totalDays} Working Day{calcResult.totalDays === 1 ? "" : "s"}
                    </span>
                    <span className="text-[10px] text-corporate-600">
                      Excludes {calcResult.weekendsCount} weekend days & {calcResult.holidaysCount} holidays
                    </span>
                  </div>
                  <span className="font-mono font-bold text-corporate-800 bg-white px-2.5 py-1 rounded-lg border border-corporate-200 text-xs">
                    {availableDays} d balance
                  </span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-corporate-600 hover:bg-corporate-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-subtle hover:scale-105 active:scale-95 transition-all"
                >
                  <span>Continue to Step 2</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Absence *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide clear justification for university records..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 resize-none transition"
                />
                <span className="text-[10px] text-slate-400 block text-right">
                  {reason.length} characters (min 5)
                </span>
              </div>

              {/* Supporting Document Upload Zone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supporting Document{" "}
                  {currentType?.requiresAttachment ? (
                    <span className="text-amber-600 font-semibold">(Required for {currentType.name})</span>
                  ) : (
                    <span className="text-slate-400 font-normal">(Optional)</span>
                  )}
                </label>

                {attachmentUrl ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-medium text-emerald-900 truncate">
                        {attachmentOriginalName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachmentUrl(null);
                        setAttachmentOriginalName(null);
                      }}
                      className="text-xs text-rose-600 font-bold hover:underline shrink-0 ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-corporate-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition group">
                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-corporate-600 transition mb-1" />
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-corporate-700">
                      {isUploading ? "Uploading file..." : "Click or drag to upload certificate"}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      PDF, JPG, PNG up to 10MB
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={loading || isUploading}
                  className="px-5 py-2 rounded-xl bg-corporate-600 hover:bg-corporate-700 disabled:opacity-50 text-white text-xs font-bold shadow-subtle hover:scale-105 active:scale-95 transition-all"
                >
                  {loading ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
