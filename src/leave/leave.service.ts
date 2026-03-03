import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplyLeaveDto } from './dto/leave.dto';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  // Helper: Check if two date ranges overlap
  private datesOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date,
  ): boolean {
    return start1 <= end2 && end1 >= start2;
  }

  // Helper: Count business days (excluding weekends)
  private countBusinessDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  }

  // Apply for leave
  async apply(userId: string, dto: ApplyLeaveDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    // Validate: end date must be after or equal to start date
    if (endDate < startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check for overlapping approved leaves
    const existingLeaves = await this.prisma.leave.findMany({
      where: {
        userId,
        status: 'APPROVED',
      },
    });

    for (const leave of existingLeaves) {
      if (
        this.datesOverlap(startDate, endDate, leave.startDate, leave.endDate)
      ) {
        throw new BadRequestException(
          'Leave request overlaps with an existing approved leave',
        );
      }
    }

    // Calculate business days (excluding weekends)
    // const leaveDays = this.countBusinessDays(startDate, endDate);

    return this.prisma.leave.create({
      data: {
        userId,
        type: dto.type,
        startDate,
        endDate,
        reason: dto.reason,
      },
      include: { user: { select: { name: true } } },
    });
  }

  // Get my leaves
  async getMyLeaves(userId: string) {
    return this.prisma.leave.findMany({
      where: { userId },
      orderBy: { appliedOn: 'desc' },
      include: { user: { select: { name: true } } },
    });
  }

  // Manager/Admin: Get pending leaves
  async getPendingLeaves() {
    return this.prisma.leave.findMany({
      where: { status: 'PENDING' },
      orderBy: { appliedOn: 'asc' },
      include: { user: { select: { name: true } } },
    });
  }

  // Approve leave
  async approve(leaveId: string, reviewerId: string) {
    const leave = await this.prisma.leave.findUnique({
      where: { id: leaveId },
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    if (leave.status !== 'PENDING') {
      throw new ForbiddenException('Leave request already processed');
    }

    return this.prisma.leave.update({
      where: { id: leaveId },
      data: {
        status: 'APPROVED',
        reviewedBy: reviewerId,
        reviewedOn: new Date(),
      },
      include: { user: { select: { name: true } } },
    });
  }

  // Reject leave
  async reject(leaveId: string, reviewerId: string, comment?: string) {
    const leave = await this.prisma.leave.findUnique({
      where: { id: leaveId },
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    if (leave.status !== 'PENDING') {
      throw new ForbiddenException('Leave request already processed');
    }

    return this.prisma.leave.update({
      where: { id: leaveId },
      data: {
        status: 'REJECTED',
        reviewedBy: reviewerId,
        reviewedOn: new Date(),
        reviewedComment: comment,
      },
      include: { user: { select: { name: true } } },
    });
  }

  // Admin: Get all leaves
  async getAllLeaves() {
    return this.prisma.leave.findMany({
      orderBy: { appliedOn: 'desc' },
      include: { user: { select: { name: true } } },
    });
  }
}
