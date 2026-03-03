import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // Get date range for weekly/monthly
  private getDateRange(period: 'weekly' | 'monthly'): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const start = new Date(now);
    if (period === 'weekly') {
      start.setDate(now.getDate() - 7);
    } else {
      start.setMonth(now.getMonth() - 1);
    }
    start.setHours(0, 0, 0, 0);

    return { start, end };
  }

  // Total worked hours per user (weekly/monthly)
  async getWorkedHoursReport(period: 'weekly' | 'monthly' = 'weekly') {
    const { start, end } = this.getDateRange(period);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
        totalHours: { not: null },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Group by user
    const userHours = new Map<
      string,
      { user: { id: string; name: string | null; email: string }; totalHours: number; totalMinutes: number; daysWorked: number }
    >();

    for (const attendance of attendances) {
      const userId = attendance.userId;
      const existing = userHours.get(userId);

      if (existing) {
        existing.totalHours += attendance.totalHours || 0;
        existing.totalMinutes += attendance.workedMinutes || 0;
        existing.daysWorked += 1;
      } else {
        userHours.set(userId, {
          user: attendance.user,
          totalHours: attendance.totalHours || 0,
          totalMinutes: attendance.workedMinutes || 0,
          daysWorked: 1,
        });
      }
    }

    return {
      period,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      data: Array.from(userHours.values()).map((item) => ({
        ...item,
        totalHours: Math.round(item.totalHours * 100) / 100,
        averageHoursPerDay:
          Math.round((item.totalHours / item.daysWorked) * 100) / 100,
      })),
    };
  }

  // Late arrivals report (after 10:15 AM)
  async getLateArrivalsReport(period: 'weekly' | 'monthly' = 'weekly') {
    const { start, end } = this.getDateRange(period);

    const lateAttendances = await this.prisma.attendance.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
        status: 'LATE',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { date: 'desc' },
    });

    // Group by user
    const userLates = new Map<
      string,
      { user: { id: string; name: string | null; email: string }; lateCount: number; dates: string[] }
    >();

    for (const attendance of lateAttendances) {
      const userId = attendance.userId;
      const existing = userLates.get(userId);
      const dateStr = attendance.date.toISOString().split('T')[0];

      if (existing) {
        existing.lateCount += 1;
        existing.dates.push(dateStr);
      } else {
        userLates.set(userId, {
          user: attendance.user,
          lateCount: 1,
          dates: [dateStr],
        });
      }
    }

    return {
      period,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      lateThreshold: '10:15 AM',
      totalLateArrivals: lateAttendances.length,
      data: Array.from(userLates.values()).sort(
        (a, b) => b.lateCount - a.lateCount,
      ),
    };
  }

  // Missing clock-outs report (auto-fixed ones)
  async getMissingClockOutsReport(period: 'weekly' | 'monthly' = 'weekly') {
    const { start, end } = this.getDateRange(period);

    const autoClockOuts = await this.prisma.attendance.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
        isAutoClockOut: true,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { date: 'desc' },
    });

    // Group by user
    const userMissing = new Map<
      string,
      { user: { id: string; name: string | null; email: string }; missingCount: number; dates: string[] }
    >();

    for (const attendance of autoClockOuts) {
      const userId = attendance.userId;
      const existing = userMissing.get(userId);
      const dateStr = attendance.date.toISOString().split('T')[0];

      if (existing) {
        existing.missingCount += 1;
        existing.dates.push(dateStr);
      } else {
        userMissing.set(userId, {
          user: attendance.user,
          missingCount: 1,
          dates: [dateStr],
        });
      }
    }

    return {
      period,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      totalMissingClockOuts: autoClockOuts.length,
      data: Array.from(userMissing.values()).sort(
        (a, b) => b.missingCount - a.missingCount,
      ),
    };
  }

  // Dashboard summary
  async getDashboardSummary(period: 'weekly' | 'monthly' = 'weekly') {
    const [workedHours, lateArrivals, missingClockOuts] = await Promise.all([
      this.getWorkedHoursReport(period),
      this.getLateArrivalsReport(period),
      this.getMissingClockOutsReport(period),
    ]);

    return {
      period,
      summary: {
        totalEmployees: workedHours.data.length,
        totalLateArrivals: lateArrivals.totalLateArrivals,
        totalMissingClockOuts: missingClockOuts.totalMissingClockOuts,
      },
      workedHours,
      lateArrivals,
      missingClockOuts,
    };
  }
}
