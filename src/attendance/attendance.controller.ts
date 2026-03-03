import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('clock-in')
  clockIn(@CurrentUser() user: { id: string }) {
    return this.attendanceService.clockIn(user.id);
  }

  @Post('clock-out')
  clockOut(@CurrentUser() user: { id: string }) {
    return this.attendanceService.clockOut(user.id);
  }

  @Get('today')
  getToday(@CurrentUser() user: { id: string }) {
    return this.attendanceService.getToday(user.id);
  }

  @Get('my')
  getMyAttendance(@CurrentUser() user: { id: string }) {
    return this.attendanceService.getMyAttendance(user.id);
  }

  @Get('team')
  @Roles(Role.MANAGER, Role.ADMIN)
  getTeamAttendance() {
    return this.attendanceService.getTeamAttendance();
  }

  @Get('all')
  @Roles(Role.ADMIN)
  getAllAttendance() {
    return this.attendanceService.getAllAttendance();
  }
}