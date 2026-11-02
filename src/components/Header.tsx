"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Bell, Lock, Key, ChevronDown, Check, User } from "lucide-react";
import NotificationDrawer from "./NotificationDrawer";
import ChangePasswordModal from "./ChangePasswordModal";

interface HeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: string[];
}

export default function Header({ title, subtitle, breadcrumbs }: HeaderProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const fetchUnread = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchUnread();
  }, []);

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const trail = breadcrumbs && breadcrumbs.length > 0 ? breadcrumbs : ["Portal", title];

  return (
    <>
      <header className="h-14 sm:h-16 border-b border-slate-200/70 bg-white px-5 sm:px-8 flex items-center justify-between shrink-0 shadow-subtle z-20 transition-colors duration-200">
        {/* Left: Minimal Breadcrumb & Title */}
        <div className="flex flex-col justify-center min-w-0">
          <nav className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            {trail.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <span className="text-slate-300 font-bold">›</span>}
                <span className={idx === trail.length - 1 ? "text-slate-800 font-semibold" : "text-slate-400 hover:text-slate-600 transition-colors duration-150"}>
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-2 mt-0.5">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
              {title}
            </h2>
            {subtitle && (
              <span className="hidden md:inline text-xs text-slate-400 font-normal truncate">
                • {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Right: Symbol-forward Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Live RBAC Status Symbol Dot */}
          <div
            className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-md border border-emerald-200/60"
            title="RBAC Security Engine Active"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-[11px] hidden sm:inline">Active</span>
          </div>

          {/* Date Indicator with Symbol */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-medium">{todayFormatted}</span>
          </div>

          {/* Notifications Symbol Button */}
          <button
            onClick={() => setIsNotificationOpen(true)}
            className="relative p-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-slate-900 transition-all duration-150 hover:scale-105 active:scale-95 shadow-subtle"
            title="Activity Notifications"
            aria-label="Activity Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-corporate-600 text-white font-bold text-[9px] flex items-center justify-center border border-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Security Action Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-600 hover:text-slate-900 transition-all duration-150 hover:scale-105 active:scale-95 shadow-subtle flex items-center gap-1.5"
              title="Security & Password"
            >
              <Key className="w-3.5 h-3.5 text-slate-500" />
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:inline" />
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-md shadow-dropdown border border-slate-200 p-1 z-50 animate-scale-in">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors duration-150"
                >
                  <User className="w-3.5 h-3.5 text-corporate-600" />
                  <span>My Profile</span>
                </Link>
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsPasswordModalOpen(true);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors duration-150"
                >
                  <Lock className="w-3.5 h-3.5 text-corporate-600" />
                  <span>Change Password</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Slide-over Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNotificationRead={fetchUnread}
      />

      {/* Change Password Dialog */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
}