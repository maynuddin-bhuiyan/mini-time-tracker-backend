import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './tasks.service';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [ScheduleModule.forRoot(), AttendanceModule],
  providers: [TasksService],
})
export class TasksModule {}
