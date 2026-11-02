import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/db";
import Sidebar from "@/components/Sidebar";
import SessionInactivityGuard from "@/components/SessionInactivityGuard";
import { ToastProvider } from "@/components/Toast";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();

  if (!session) {
    redirect("/login");
  }

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      role: true,
      department: true,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    redirect("/api/auth/logout");
  }

  // Calculate pending approvals count for Manager / HR / Admin badge
  let pendingCount = 0;
  if (user.role.name === "SUPER_ADMIN" || user.role.name === "HR_ADMIN") {
    pendingCount = await prisma.leaveRequest.count({
      where: { status: { in: ["PENDING", "MANAGER_APPROVED"] } },
    });
  } else if (user.role.name === "MANAGER") {
    pendingCount = await prisma.leaveRequest.count({
      where: {
        status: "PENDING",
        user: {
          OR: [
            { managerId: user.id },
            ...(user.departmentId ? [{ departmentId: user.departmentId }] : []),
          ],
        },
      },
    });
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 antialiased">
      {/* 1. Left Enterprise Fixed Sidebar */}
      <Sidebar
        user={{
          id: user.id,
          employeeCode: user.employeeCode,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role.name as any,
          department: user.department?.name || "Unassigned",
        }}
        pendingApprovalsCount={pendingCount}
      />

      {/* 2. Main Enterprise Content Area */}
      <ToastProvider>
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50">
          {children}
        </div>
      </ToastProvider>

      {/* 3. Session Inactivity Security Guard */}
      <SessionInactivityGuard />
    </div>
  );
}
