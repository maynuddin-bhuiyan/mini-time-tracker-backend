import { IsEnum, IsString, IsDateString, IsOptional } from 'class-validator';
import { LeaveType } from '@prisma/client';

export class ApplyLeaveDto {
  @IsEnum(['CASUAL', 'SICK', 'UNPAID', 'VACATION', 'PERSONAL', 'OTHER'])
  type: LeaveType;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
