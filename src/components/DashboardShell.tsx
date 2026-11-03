"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  User,
  Plus,
  X,
  Menu,
} from "lucide-react";

interface MobileNavContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const MobileNavContext = createContext<MobileNavContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
});

export const useMobileNav = () => useContext(MobileNavContext);

interface DashboardShellProps {
  children: React.ReactNode;
  user: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "SUPER_ADMIN" | "HR_ADMIN" | "MANAGER" | "EMPLOYEE";
    department: string;
  };
  pendingApprovalsCount?: number;
}

export default function DashboardShell({
  children,
  user,
  pendingApprovalsCount = 0,
}: DashboardShellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer upon route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  const isSupervisorOrAdmin = ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"].includes(user.role);

  return (
    <MobileNavContext.Provider value={{ isOpen, open, close, toggle }}>
      <div className="flex h-[100dvh] w-full overflow-hidden bg-slate-50 antialiased">
        {/* 1. Desktop Fixed Sidebar (Visible on md and up) */}
        <div className="hidden md:flex shrink-0">
          <Sidebar user={user} pendingApprovalsCount={pendingApprovalsCount} />
        </div>

        {/* 2. Mobile Slide-over Drawer (Visible only when open on mobile) */}
        {isOpen && (
          <div
            className="fixed inset-0 z-50 md:hidden bg-slate-900/50 backdrop-blur-sm transition-opacity duration-200"
            onClick={close}
            aria-hidden="true"
          >
            <div
              className="relative w-72 max-w-[85vw] h-[100dvh] bg-white shadow-2xl flex flex-col justify-between animate-slide-in-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Drawer Close Button */}
              <button
                onClick={close}
                className="absolute top-4 right-3 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-corporate-600"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>

              <Sidebar
                user={user}
                pendingApprovalsCount={pendingApprovalsCount}
                isMobile
                onNavigate={close}
              />
            </div>
          </div>
        )}

        {/* 3. Main Enterprise Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50 relative pb-16 md:pb-0">
          {children}

          {/* 4. Mobile Bottom Quick-Navigation Bar (Thumb-friendly for mobile phones) */}
          <nav
            aria-label="Mobile Bottom Navigation"
            className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around shadow-[0_-2px_10px_rgba(0,0,0,0.04)] pb-[calc(0.4rem+env(safe-area-inset-bottom,0px))]"
          >
            {/* Dashboard */}
            <Link
              href="/dashboard"
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                pathname === "/dashboard"
                  ? "text-corporate-700 font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mb-0.5" />
              <span>Workspace</span>
            </Link>

            {/* Team Calendar */}
            <Link
              href="/dashboard/team-calendar"
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                pathname === "/dashboard/team-calendar"
                  ? "text-corporate-700 font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <CalendarDays className="w-4 h-4 mb-0.5" />
              <span>Calendar</span>
            </Link>

            {/* Supervisor Approvals or Profile */}
            {isSupervisorOrAdmin ? (
              <Link
                href="/dashboard/approvals"
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                  pathname === "/dashboard/approvals"
                    ? "text-corporate-700 font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <div className="relative">
                  <CheckSquare className="w-4 h-4 mb-0.5" />
                  {pendingApprovalsCount > 0 && (
                    <span className="absolute -top-1 -right-2 px-1 text-[9px] font-bold rounded-full bg-amber-500 text-white leading-tight">
                      {pendingApprovalsCount}
                    </span>
                  )}
                </div>
                <span>Approvals</span>
              </Link>
            ) : null}

            {/* My Profile */}
            <Link
              href="/dashboard/profile"
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                pathname === "/dashboard/profile"
                  ? "text-corporate-700 font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <User className="w-4 h-4 mb-0.5" />
              <span>Profile</span>
            </Link>

            {/* More Menu Toggle */}
            <button
              onClick={toggle}
              className="flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
              aria-label="Open full menu"
            >
              <Menu className="w-4 h-4 mb-0.5" />
              <span>Menu</span>
            </button>
          </nav>
        </div>
      </div>
    </MobileNavContext.Provider>
  );
}
