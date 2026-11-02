"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (
        window.location.search.includes("reset") ||
        window.location.search.includes("invalid") ||
        window.location.search.includes("expired")
      ) {
        // Clear cookie directly and call logout endpoint
        document.cookie = "auth_session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      }
    }
  }, []);

  const demoAccounts = [
    {
      roleName: "Super Admin",
      userName: "Adrian Sanchez",
      email: "adrian.sanchez@company.com",
      pass: "Password123!",
      symbol: "★",
      badge: "text-purple-700 bg-purple-50 border-purple-200",
    },
    {
      roleName: "HR Admin",
      userName: "Emmanuel Creo",
      email: "emmanuel.creo@company.com",
      pass: "Password123!",
      symbol: "◆",
      badge: "text-corporate-700 bg-blue-50 border-blue-200",
    },
    {
      roleName: "Dept Manager",
      userName: "Gabrielle Red Jeciel",
      email: "gabrielle.jeciel@company.com",
      pass: "Password123!",
      symbol: "▲",
      badge: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      roleName: "Employee",
      userName: "Christoper Claveria",
      email: "christoper.claveria@company.com",
      pass: "Password123!",
      symbol: "●",
      badge: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
  ];

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected network error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6 antialiased">
      <div className="w-full max-w-md bg-white rounded-xl shadow-card border border-slate-200/80 p-6 sm:p-8 animate-scale-in">
        {/* Brand & Heading */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-subtle border border-emerald-600">
              CvSU
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 tracking-wider uppercase block">
            Cavite State University
          </span>
          <span className="text-[10px] text-slate-500 block">
            College of Engineering and Information Technology (CEIT)
          </span>
          <h1 className="text-base font-bold text-slate-900 tracking-tight mt-1.5">
            Employee Leave Application System
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Sign in with your institutional credentials
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-rose-50 p-2.5 text-xs font-medium text-rose-700 flex items-start gap-2 border border-rose-200 animate-slide-down">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                <Mail className="h-3.5 w-3.5" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="block w-full rounded-md border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPassword ? "Hide" : "Show"}</span>
              </button>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                <Lock className="h-3.5 w-3.5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="block w-full rounded-md border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-corporate-600 focus:ring-1 focus:ring-corporate-600 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-corporate-600 hover:bg-corporate-700 text-white text-xs font-semibold shadow-subtle hover:shadow-card hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:opacity-50"
          >
            <span>{loading ? "Signing In..." : "Sign In"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* 1-Click Role Switcher */}
        <div className="mt-5 pt-4 border-t border-slate-200/70">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2">
            1-Click Demo Profiles
          </p>

          <div className="grid grid-cols-2 gap-1.5">
            {demoAccounts.map((demo) => (
              <button
                key={demo.roleName}
                type="button"
                onClick={() => handleFillDemo(demo.email, demo.pass)}
                className="p-2 rounded-md border border-slate-200/80 hover:border-corporate-300 hover:bg-corporate-50/40 transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 text-left flex items-center gap-2 group"
              >
                <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold border ${demo.badge}`}>
                  {demo.symbol}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 group-hover:text-corporate-700 truncate">
                    {demo.roleName}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{demo.userName}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400 font-mono">
          Protected by Strict RBAC
        </div>
      </div>
    </div>
  );
}