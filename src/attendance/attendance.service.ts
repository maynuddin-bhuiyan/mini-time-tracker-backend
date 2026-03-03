import { Injectable, BadRequestException } from '@nestjs/common';
import { AttendanceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // Clock In
  async clockIn(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already clocked in today
    const existing = await this.prisma.attendance.findFirst({
      where: { userId, date: today },
    });

    if (existing?.checkIn && !existing?.checkOut) {
      throw new BadRequestException(
        'Already clocked in today. Please clock out first.',
      );
    }

    if (existing?.checkIn && existing?.checkOut) {
      throw new BadRequestException('Already completed attendance for today');
    }

    const now = new Date();
    // Late threshold: 10:15 AM
    const lateThreshold = new Date(today);
    lateThreshold.setHours(10, 15, 0, 0);

    const status: AttendanceStatus = now > lateThreshold ? 'LATE' : 'PRESENT';

    // If record exists, update it; otherwise create new
    if (existing) {
      return this.prisma.attendance.update({
        where: { id: existing.id },
        data: { checkIn: now, status },
        include: { user: { select: { name: true } } },
      });
    }

    return this.prisma.attendance.create({
      data: { userId, date: today, checkIn: now, status },
      include: { user: { select: { name: true } } },
    });
  }

  // Clock Out
  async clockOut(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.findFirst({
      where: { userId, date: today },
    });

    if (!attendance?.checkIn) {
      throw new BadRequestException('Must clock in first');
    }

    if (attendance.checkOut) {
      throw new BadRequestException('Already clocked out');
    }

    const now = new Date();
    const workedMinutes = Math.floor(
      (now.getTime() - attendance.checkIn.getTime()) / (1000 * 60),
    );
    const totalHours = workedMinutes / 60;

    return this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: now,
        workedMinutes,
        totalHours: Math.round(totalHours * 100) / 100,
      },
      include: { user: { select: { name: true } } },
    });
  }

  // Auto clock-out all active sessions at 11:59 PM (called by cron)
  async autoClockOutAll() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all attendance records without clock-out
    const activeAttendances = await this.prisma.attendance.findMany({
      where: {
        date: today,
        checkIn: { not: null },
        checkOut: null,
      },
    });

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 0, 0);

    const results: typeof activeAttendances = [];
    for (const attendance of activeAttendances) {
      const workedMinutes = Math.floor(
        (endOfDay.getTime() - attendance.checkIn!.getTime()) / (1000 * 60),
      );
      const totalHours = workedMinutes / 60;

      const updated = await this.prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOut: endOfDay,
          workedMinutes,
          totalHours: Math.round(totalHours * 100) / 100,
          isAutoClockOut: true,
        },
      });
      results.push(updated);
    }

    return { autoClockOutCount: results.length, records: results };
  }

  // Get today's attendance
  async getToday(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.attendance.findFirst({
      where: { userId, date: today },
      include: { user: { select: { name: true } } },
    });
  }

  // Get my attendance history
  async getMyAttendance(userId: string) {
    return this.prisma.attendance.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: { user: { select: { name: true } } },
    });
  }

  // Manager: Get team attendance (STAFF users)
  async getTeamAttendance() {
    return this.prisma.attendance.findMany({
      where: { user: { role: 'STAFF' } },
      orderBy: { date: 'desc' },
      include: { user: { select: { name: true } } },
    });
  }

  // Admin: Get all attendance
  async getAllAttendance() {
    return this.prisma.attendance.findMany({
      orderBy: { date: 'desc' },
      include: { user: { select: { name: true } } },
    });
  }
}
