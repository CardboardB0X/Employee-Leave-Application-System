"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import {
  User,
  Mail,
  Phone,
  MapPin,
  HeartHandshake,
  Building2,
  Shield,
  Calendar,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Permitted editable fields
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [address, setAddress] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setPhoneNumber(data.user.phoneNumber || "");
        setEmergencyContact(data.user.emergencyContact || "");
        setAddress(data.user.address || "");
      } else {
        setError("Failed to load user profile.");
      }
    } catch {
      setError("Network error while loading profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSavePermittedDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          emergencyContact,
          address,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update profile.");
      } else {
        setSuccess("Profile details saved successfully.");
        fetchProfile();
      }
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const roleBadges: Record<string, { label: string; badge: string }> = {
    SUPER_ADMIN: { label: "Super Admin", badge: "bg-purple-50 text-purple-700 border-purple-200" },
    HR_ADMIN: { label: "HR Admin", badge: "bg-blue-50 text-corporate-700 border-blue-200" },
    MANAGER: { label: "Department Manager", badge: "bg-amber-50 text-amber-700 border-amber-200" },
    EMPLOYEE: { label: "Employee", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <Header
        title="Personal Profile"
        subtitle="Cavite State University - CEIT Personnel Account"
        breadcrumbs={["Portal", "Profile"]}
      />

      <main className="flex-1 overflow-y-auto px-5 sm:px-8 pb-8 pt-4 space-y-5 animate-fade-in">
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

        {error && (
          <div className="p-3 rounded-md text-xs font-medium flex items-center justify-between border shadow-subtle bg-rose-50 text-rose-800 border-rose-200 animate-slide-down">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              {error}
            </span>
            <button
              onClick={() => setError(null)}
              className="text-rose-700 hover:text-rose-900 font-bold ml-4"
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-xs text-slate-400 font-medium">
            Loading personnel profile...
          </div>
        ) : profile ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left Column: Official Profile Card */}
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle p-5">
                <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
                  <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-800 font-bold text-xl flex items-center justify-center border-2 border-slate-200 mb-3 shadow-subtle">
                    {profile.firstName[0]}
                    {profile.lastName[0]}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {profile.firstName} {profile.lastName}
                  </h3>
                  <span className="text-xs font-mono text-slate-400 mt-0.5">
                    {profile.employeeCode}
                  </span>
                  <div className="mt-2.5">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        roleBadges[profile.role?.name]?.badge || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {roleBadges[profile.role?.name]?.label || profile.role?.name}
                    </span>
                  </div>
                </div>

                <div className="pt-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> Department
                    </span>
                    <span className="font-semibold text-slate-700">
                      {profile.department?.name || "Unassigned"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> Direct Supervisor
                    </span>
                    <span className="font-semibold text-slate-700">
                      {profile.manager
                        ? `${profile.manager.firstName} ${profile.manager.lastName}`
                        : "Executive / None"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Institutional Email
                    </span>
                    <span className="font-mono text-slate-700 text-[11px]">
                      {profile.email}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Date Registered
                    </span>
                    <span className="font-medium text-slate-700">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Total Submissions
                    </span>
                    <span className="font-bold text-slate-900">
                      {profile._count?.leaveRequests || 0} applications
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="w-full py-2 px-3 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-150 shadow-subtle hover:scale-[1.01]"
                  >
                    <Lock className="w-3.5 h-3.5 text-corporate-600" />
                    <span>Change Portal Password</span>
                  </button>
                </div>
              </div>

              {/* Institution Seal Card */}
              <div className="bg-emerald-50/50 rounded-xl border border-emerald-200/60 p-4 text-xs text-emerald-900 space-y-1">
                <p className="font-bold text-[11px] uppercase tracking-wider text-emerald-800">
                  Cavite State University
                </p>
                <p className="text-[11px] text-emerald-700">
                  College of Engineering and Information Technology (CEIT)
                </p>
                <p className="text-[10px] text-emerald-600/90 pt-1">
                  Don Severino de las Alas Campus, Indang, Cavite • www.cvsu.edu.ph
                </p>
              </div>
            </div>

            {/* Right Column (2 spans): Update Permitted Profile Details & Quotas */}
            <div className="lg:col-span-2 space-y-5">
              {/* Permitted Profile Details Form */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle p-5">
                <div className="pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Permitted Profile Details
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Keep your contact and emergency information up to date
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-corporate-700 border border-blue-200">
                    Employee Self-Service
                  </span>
                </div>

                <form onSubmit={handleSavePermittedDetails} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Contact Phone / Mobile
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+63 912 345 6789"
                          className="w-full pl-8 pr-3 py-2 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Official contact number for leave notifications.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Emergency Contact Person & Phone
                      </label>
                      <div className="relative">
                        <HeartHandshake className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={emergencyContact}
                          onChange={(e) => setEmergencyContact(e.target.value)}
                          placeholder="e.g., Maria Santos (+63 917 123 4567)"
                          className="w-full pl-8 pr-3 py-2 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Designated contact during medical or emergency absence.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Residential / Mailing Address
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Barangay, City, Province, Postal Code"
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">
                      Changes are securely recorded in the university audit log.
                    </span>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-md bg-corporate-600 hover:bg-corporate-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-subtle hover:scale-105 active:scale-95 transition-all duration-150"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? "Saving..." : "Save Details"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Fiscal Year Leave Quotas Overview */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle p-5">
                <div className="pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Current Year Leave Entitlements ({new Date().getFullYear()})
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Statutory Leave Allowances
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {profile.leaveBalances?.map((bal: any) => {
                    const total = Number(bal.totalAllocated) + Number(bal.carriedOver);
                    const remaining = total - Number(bal.usedDays) - Number(bal.pendingDays);
                    return (
                      <div
                        key={bal.id}
                        className="p-3 rounded-lg border border-slate-200/70 bg-slate-50/50 hover:bg-white hover:border-corporate-300 transition-all duration-150"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">
                            {bal.leaveType?.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {bal.leaveType?.code}
                          </span>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                          <span className="text-lg font-extrabold text-corporate-700">
                            {remaining}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            of {total} days remaining
                          </span>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-slate-200/50 flex justify-between text-[10px] text-slate-500">
                          <span>Used: {Number(bal.usedDays)}d</span>
                          <span>Pending: {Number(bal.pendingDays)}d</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
