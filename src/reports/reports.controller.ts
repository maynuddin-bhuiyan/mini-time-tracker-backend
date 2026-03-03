import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MANAGER, Role.ADMIN)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboard(@Query('period') period: 'weekly' | 'monthly' = 'weekly') {
    return this.reportsService.getDashboardSummary(period);
  }

  @Get('worked-hours')
  getWorkedHours(@Query('period') period: 'weekly' | 'monthly' = 'weekly') {
    return this.reportsService.getWorkedHoursReport(period);
  }

  @Get('late-arrivals')
  getLateArrivals(@Query('period') period: 'weekly' | 'monthly' = 'weekly') {
    return this.reportsService.getLateArrivalsReport(period);
  }

  @Get('missing-clockouts')
  getMissingClockOuts(@Query('period') period: 'weekly' | 'monthly' = 'weekly') {
    return this.reportsService.getMissingClockOutsReport(period);
  }
}
