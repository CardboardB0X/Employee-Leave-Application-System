import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { unauthorizedResponse } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

const updateProfileSchema = z.object({
  phoneNumber: z.string().max(50).optional().nullable(),
  emergencyContact: z.string().max(100).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  const currentYear = new Date().getFullYear();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
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
      createdAt: true,
      role: { select: { id: true, name: true, description: true } },
      department: { select: { id: true, name: true, code: true } },
      manager: { select: { id: true, firstName: true, lastName: true, email: true } },
      leaveBalances: {
        where: { fiscalYear: currentYear },
        include: { leaveType: { select: { id: true, name: true, code: true, isPaid: true } } },
      },
      _count: {
        select: { leaveRequests: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User profile not found." }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const parseResult = updateProfileSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "Invalid profile input." },
        { status: 400 }
      );
    }

    const { phoneNumber, emergencyContact, address } = parseResult.data;

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        phoneNumber: phoneNumber ? phoneNumber.trim() : null,
        emergencyContact: emergencyContact ? emergencyContact.trim() : null,
        address: address ? address.trim() : null,
      },
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
      },
    });

    await logAuditEvent({
      actorId: session.userId,
      action: "PROFILE_UPDATED",
      resourceType: "USER",
      resourceId: session.userId,
      details: {
        fieldsUpdated: ["phoneNumber", "emergencyContact", "address"],
      },
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Personal profile details updated successfully.",
      user: updatedUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update profile." },
      { status: 500 }
    );
  }
}
