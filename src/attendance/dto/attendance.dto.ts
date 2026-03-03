import { AttendanceStatus } from '@prisma/client';

export class AttendanceRecordDto {
  id: string;
  userId: string;
  userName?: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: AttendanceStatus;
  totalHours: number | null;
}
