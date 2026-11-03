"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Bell, Lock, Key, ChevronDown, Check, User, Menu } from "lucide-react";
import NotificationDrawer from "./NotificationDrawer";
import ChangePasswordModal from "./ChangePasswordModal";
import { useMobileNav } from "./DashboardShell";

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

  const { toggle: toggleMobileNav } = useMobileNav();

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
      <header className="h-14 sm:h-16 border-b border-slate-200/70 bg-white px-3.5 sm:px-8 flex items-center justify-between shrink-0 shadow-subtle z-20 transition-colors duration-200">
        {/* Left: Mobile Hamburger Toggle + Breadcrumb & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Mobile Hamburger Button */}
          <button
            onClick={toggleMobileNav}
            className="md:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-corporate-600"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col justify-center min-w-0">
            <nav className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 font-medium">
              {trail.map((crumb, idx) => (
                <span key={idx} className="flex items-center gap-1 sm:gap-1.5">
                  {idx > 0 && <span className="text-slate-300 font-bold">›</span>}
                  <span className={idx === trail.length - 1 ? "text-slate-800 font-semibold" : "text-slate-400 hover:text-slate-600 transition-colors duration-150"}>
                    {crumb}
                  </span>
                </span>
              ))}
            </nav>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-xs sm:text-base font-bold text-slate-900 tracking-tight truncate">
                {title}
              </h2>
              {subtitle && (
                <span className="hidden md:inline text-xs text-slate-400 font-normal truncate">
                  • {subtitle}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Symbol-forward Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Live RBAC Status Symbol Dot */}
          <div
            className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50/80 px-2 sm:px-2.5 py-1 rounded-md border border-emerald-200/60"
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
            className="relative p-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-slate-900 transition-all duration-150 hover:scale-105 active:scale-95 shadow-subtle min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Activity Notifications"
            aria-label="Activity Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-corporate-600 text-white font-bold text-[9px] flex items-center justify-center border border-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Account Controls */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-md bg-white hover:bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-700 hover:text-slate-900 transition-all duration-150 shadow-subtle min-h-[36px]"
              aria-label="User Account Menu"
              aria-expanded={isProfileMenuOpen}
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isProfileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsProfileMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-lg shadow-elevation border border-slate-200/80 py-1 z-40 animate-scale-in text-xs">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Account Settings
                    </p>
                  </div>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>View Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsPasswordModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                  >
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    <span>Change Password</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Slide-out Activity Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => {
          setIsNotificationOpen(false);
          fetchUnread();
        }}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
}
