"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckSquare,
  LayoutDashboard,
  LogOut,
  ShieldAlert,
  Users,
  WalletCards,
  User,
  FileBarChart,
  Tag,
} from "lucide-react";

interface SidebarProps {
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
  isMobile?: boolean;
  onNavigate?: () => void;
}

export default function Sidebar({
  user,
  pendingApprovalsCount = 0,
  isMobile = false,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const navSections = [
    {
      title: "Workspace",
      items: [
        {
          label: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
        },
        {
          label: "My Profile",
          href: "/dashboard/profile",
          icon: User,
          roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
        },
        {
          label: "Team Calendar",
          href: "/dashboard/team-calendar",
          icon: CalendarDays,
          roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
        },
      ],
    },
    {
      title: "Supervisory",
      items: [
        {
          label: "Approvals",
          href: "/dashboard/approvals",
          icon: CheckSquare,
          roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
          badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
        },
        {
          label: "Leave Quotas",
          href: "/dashboard/balances",
          icon: WalletCards,
          roles: ["SUPER_ADMIN", "HR_ADMIN"],
        },
        {
          label: "Leave Reports",
          href: "/dashboard/reports",
          icon: FileBarChart,
          roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
        },
      ],
    },
    {
      title: "Admin",
      items: [
        {
          label: "Employees",
          href: "/dashboard/users",
          icon: Users,
          roles: ["SUPER_ADMIN", "HR_ADMIN"],
        },
        {
          label: "Leave Types",
          href: "/dashboard/leave-types",
          icon: Tag,
          roles: ["SUPER_ADMIN", "HR_ADMIN"],
        },
        {
          label: "Audit Logs",
          href: "/dashboard/audit-logs",
          icon: ShieldAlert,
          roles: ["SUPER_ADMIN", "HR_ADMIN"],
        },
      ],
    },
  ];

  const roleStyles: Record<string, { label: string; badge: string }> = {
    SUPER_ADMIN: { label: "Admin", badge: "bg-purple-50 text-purple-700 border-purple-200/60" },
    HR_ADMIN: { label: "HR", badge: "bg-blue-50 text-corporate-700 border-blue-200/60" },
    MANAGER: { label: "Manager", badge: "bg-amber-50 text-amber-700 border-amber-200/60" },
    EMPLOYEE: { label: "Employee", badge: "bg-emerald-50 text-emerald-700 border-emerald-200/60" },
  };

  return (
    <aside
      className={`w-64 bg-white border-r border-slate-200/80 text-slate-700 flex flex-col justify-between shrink-0 select-none shadow-subtle transition-all duration-200 ${
        isMobile ? "h-full w-full" : "h-screen"
      }`}
    >
      <div className="overflow-y-auto">
        {/* Brand Header */}
        <div className="h-14 sm:h-16 flex items-center justify-between px-5 border-b border-slate-200/70">
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-md bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-subtle transition-transform duration-200 group-hover:scale-105 border border-emerald-600">
              CvSU
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 tracking-tight block">CvSU • CEIT</span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">Leave System</span>
            </div>
          </Link>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
        </div>

        {/* User Card */}
        <div className="p-3 mx-3 my-2.5 rounded-lg bg-slate-50/80 border border-slate-200/60 transition-colors duration-150 hover:bg-slate-100/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-300">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user.firstName} {user.lastName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${roleStyles[user.role]?.badge || "bg-slate-100 text-slate-600"}`}>
                  {roleStyles[user.role]?.label || user.role}
                </span>
                <span className="text-[10px] font-mono text-slate-400 truncate">{user.employeeCode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="px-3 py-1 space-y-4">
          {navSections.map((section, sIdx) => {
            const visibleItems = section.items.filter((item) => item.roles.includes(user.role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2.5 block mb-1">
                  {section.title}
                </span>

                {visibleItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={`flex items-center justify-between px-2.5 py-2 sm:py-1.5 rounded-md text-xs font-medium transition-all duration-150 min-h-[38px] ${
                        isActive
                          ? "bg-corporate-600 text-white shadow-subtle font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200/70"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 transition-transform duration-150 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Logout Action */}
      <div className="p-3 border-t border-slate-200/70">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 sm:py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50/70 transition-all duration-150 min-h-[38px]"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
