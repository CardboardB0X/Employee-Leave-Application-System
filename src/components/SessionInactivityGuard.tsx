"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, LogOut, RefreshCw } from "lucide-react";

// Inactivity timeout: 15 minutes = 900 seconds
// Warning modal appears at 14 minutes (60 seconds remaining)
const INACTIVITY_TIMEOUT_MS = 14 * 60 * 1000;
const COUNTDOWN_SECONDS = 60;

export default function SessionInactivityGuard() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(COUNTDOWN_SECONDS);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (showWarning) return; // Do not reset if warning modal is already active

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      triggerWarning();
    }, INACTIVITY_TIMEOUT_MS);
  };

  const triggerWarning = () => {
    setShowWarning(true);
    setSecondsRemaining(COUNTDOWN_SECONDS);

    countdownIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          handleAutoLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStayLoggedIn = () => {
    setShowWarning(false);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    resetTimer();
  };

  const handleAutoLogout = async () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setShowWarning(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    router.push("/login?expired=1");
    router.refresh();
  };

  useEffect(() => {
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    const handleUserActivity = () => resetTimer();

    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity);
    });

    resetTimer();

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showWarning]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-amber-300 w-full max-w-md overflow-hidden animate-scale-in">
        <div className="p-5 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>

          <h3 className="text-base font-bold text-slate-900">
            Session Inactivity Warning
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed">
            In compliance with Information Assurance and Security standards, your session will automatically terminate due to inactivity in:
          </p>

          <div className="py-2">
            <span className="text-3xl font-extrabold font-mono text-amber-700 bg-amber-50 px-4 py-1.5 rounded-lg border border-amber-200">
              00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            Please confirm you are still active to prevent automatic logout.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
          <button
            onClick={handleAutoLogout}
            className="px-3.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out Now</span>
          </button>

          <button
            onClick={handleStayLoggedIn}
            className="px-4 py-1.5 rounded-md bg-corporate-600 hover:bg-corporate-700 text-xs font-semibold text-white flex items-center gap-1.5 shadow-subtle hover:scale-105 active:scale-95 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Stay Logged In</span>
          </button>
        </div>
      </div>
    </div>
  );
}
