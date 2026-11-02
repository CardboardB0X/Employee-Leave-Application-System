import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionFromRequest, hashPassword } from "@/lib/auth";
import { forbiddenResponse, unauthorizedResponse } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

const createUserSchema = z.object({
  employeeCode: z.string().min(2),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  roleName: z.enum(["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"]),
  departmentId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
});

const updateUserSchema = z.object({
  id: z.string().uuid("Invalid user ID"),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  departmentId: z.string().optional().nullable(),
  roleName: z.enum(["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
  managerId: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "SUSPENDED", "TERMINATED"]).optional(),
});

// GET /api/admin/users - User directory with leave statistics
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  if (!["SUPER_ADMIN", "HR_ADMIN", "MANAGER"].includes(session.role)) {
    return forbiddenResponse();
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      emergencyContact: true,
      address: true,
      status: true,
      failedLoginAttempts: true,
      lockedUntil: true,
      createdAt: true,
      role: { select: { id: true, name: true } },
      department: { select: { id: true, name: true, code: true } },
      manager: { select: { id: true, firstName: true, lastName: true, email: true } },
      _count: {
        select: {
          leaveRequests: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

// POST /api/admin/users - Create new employee account
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  if (!["SUPER_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return forbiddenResponse("Only Super Admin and HR Admin can provision new employee accounts.");
  }

  try {
    const body = await req.json();
    const parseResult = createUserSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    if (data.roleName === "SUPER_ADMIN" && session.role !== "SUPER_ADMIN") {
      return forbiddenResponse("Only Super Admin can assign the Super Admin role.");
    }

    // Check duplicate email or code
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email.toLowerCase() }, { employeeCode: data.employeeCode }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email or employee code already exists." },
        { status: 400 }
      );
    }

    const role = await prisma.role.findUnique({
      where: { name: data.roleName },
    });

    if (!role) {
      return NextResponse.json({ error: "Invalid role specified." }, { status: 400 });
    }

    const passwordHash = await hashPassword(data.password);

    // Create user and initial 2026 leave balances in transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          employeeCode: data.employeeCode,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email.toLowerCase(),
          passwordHash,
          roleId: role.id,
          departmentId: data.departmentId || null,
          managerId: data.managerId || null,
        },
      });

      // Seed current year leave balances
      const currentYear = new Date().getFullYear();
      const leaveTypes = await tx.leaveType.findMany({ where: { isActive: true } });

      for (const lt of leaveTypes) {
        await tx.leaveBalance.create({
          data: {
            userId: user.id,
            leaveTypeId: lt.id,
            fiscalYear: currentYear,
            totalAllocated: lt.defaultAnnualDays,
            usedDays: 0,
            pendingDays: 0,
            carriedOver: 0,
          },
        });
      }

      return user;
    });

    await logAuditEvent({
      actorId: session.userId,
      action: "USER_CREATED",
      resourceType: "USER",
      resourceId: newUser.id,
      details: {
        email: newUser.email,
        employeeCode: newUser.employeeCode,
        role: data.roleName,
      },
      req,
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          employeeCode: newUser.employeeCode,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create user." },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users - Edit existing employee account
export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  if (!["SUPER_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return forbiddenResponse("Only Super Admin and HR Admin can modify employee accounts.");
  }

  try {
    const body = await req.json();
    const parseResult = updateUserSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "Invalid update input." },
        { status: 400 }
      );
    }

    const { id, firstName, lastName, departmentId, roleName, managerId, status } = parseResult.data;

    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    // Role safety: HR Admin cannot edit Super Admin or promote to Super Admin
    if (existingUser.role.name === "SUPER_ADMIN" && session.role !== "SUPER_ADMIN") {
      return forbiddenResponse("Only Super Admin can modify a Super Admin account.");
    }

    if (roleName === "SUPER_ADMIN" && session.role !== "SUPER_ADMIN") {
      return forbiddenResponse("Only Super Admin can grant Super Admin privileges.");
    }

    let roleId = existingUser.roleId;
    if (roleName && roleName !== existingUser.role.name) {
      const newRole = await prisma.role.findUnique({ where: { name: roleName } });
      if (newRole) {
        roleId = newRole.id;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        departmentId: departmentId !== undefined ? departmentId : existingUser.departmentId,
        managerId: managerId !== undefined ? managerId : existingUser.managerId,
        roleId,
        ...(status ? { status } : {}),
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        role: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logAuditEvent({
      actorId: session.userId,
      action: "USER_UPDATED",
      resourceType: "USER",
      resourceId: updatedUser.id,
      details: {
        employeeCode: updatedUser.employeeCode,
        status: updatedUser.status,
        role: updatedUser.role.name,
      },
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Employee account successfully updated.",
      user: updatedUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update employee account." },
      { status: 500 }
    );
  }
}
