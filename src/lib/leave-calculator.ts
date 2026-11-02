import { eachDayOfInterval, isWeekend, format } from "date-fns";
import prisma from "./db";

/**
 * Calculates number of working days between two dates (inclusive),
 * excluding weekends (Saturday & Sunday) and official company holidays.
 */
export function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  isHalfDay: boolean = false,
  holidayDates: string[] = []
): { totalDays: number; holidaysCount: number; weekendsCount: number } {
  if (startDate > endDate) {
    throw new Error("Start date cannot be after end date.");
  }

  if (isHalfDay) {
    return { totalDays: 0.5, holidaysCount: 0, weekendsCount: 0 };
  }

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  let weekendsCount = 0;
  let holidaysCount = 0;
  let workingDays = 0;

  for (const day of days) {
    if (isWeekend(day)) {
      weekendsCount++;
    } else {
      const formatted = format(day, "yyyy-MM-dd");
      if (holidayDates.includes(formatted)) {
        holidaysCount++;
      } else {
        workingDays++;
      }
    }
  }

  return { totalDays: workingDays, holidaysCount, weekendsCount };
}

/**
 * Server-side calculator querying MySQL holidays automatically
 */
export async function calculateWorkingDaysAsync(
  startDate: Date,
  endDate: Date,
  isHalfDay: boolean = false
): Promise<{ totalDays: number; holidaysCount: number; weekendsCount: number }> {
  if (startDate > endDate) {
    throw new Error("Start date cannot be after end date.");
  }

  if (isHalfDay) {
    return { totalDays: 0.5, holidaysCount: 0, weekendsCount: 0 };
  }

  const holidays = await prisma.holiday.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const holidayDateStrings = holidays.map((h) => format(h.date, "yyyy-MM-dd"));
  return calculateWorkingDays(startDate, endDate, isHalfDay, holidayDateStrings);
}

/**
 * Check if the user already has an active overlapping leave request.
 */
export async function hasConflictingLeave(
  userId: string,
  startDate: Date,
  endDate: Date,
  excludeRequestId?: string
): Promise<boolean> {
  const overlapping = await prisma.leaveRequest.findFirst({
    where: {
      userId,
      id: excludeRequestId ? { not: excludeRequestId } : undefined,
      status: { in: ["PENDING", "MANAGER_APPROVED", "APPROVED"] },
      OR: [
        {
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      ],
    },
  });

  return Boolean(overlapping);
}

/**
 * Generate human-readable sequential request code e.g. "LR-2026-0042"
 */
export async function generateRequestNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const count = await prisma.leaveRequest.count({
    where: {
      createdAt: {
        gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
        lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
      },
    },
  });

  const sequential = String(count + 1).padStart(4, "0");
  return `LR-${currentYear}-${sequential}`;
}
