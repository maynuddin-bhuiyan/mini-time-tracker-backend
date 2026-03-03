import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AttendanceService } from '../attendance/attendance.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private attendanceService: AttendanceService) {}

  // Run at 11:59 PM every day
  @Cron('59 23 * * *')
  async handleAutoClockOut() {
    this.logger.log('Running auto clock-out job at 11:59 PM');
    try {
      const result = await this.attendanceService.autoClockOutAll();
      this.logger.log(
        `Auto clock-out completed: ${result.autoClockOutCount} records updated`,
      );
    } catch (error) {
      this.logger.error('Auto clock-out job failed', error);
    }
  }
}
