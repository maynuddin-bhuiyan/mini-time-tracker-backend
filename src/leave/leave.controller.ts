import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApplyLeaveDto } from './dto/leave.dto';
import { Role } from '@prisma/client';

@Controller('leave')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveController {
  constructor(private leaveService: LeaveService) {}

  @Post('apply')
  apply(@CurrentUser() user: { id: string }, @Body() dto: ApplyLeaveDto) {
    return this.leaveService.apply(user.id, dto);
  }

  @Get('my')
  getMyLeaves(@CurrentUser() user: { id: string }) {
    return this.leaveService.getMyLeaves(user.id);
  }

  @Get('pending')
  @Roles(Role.MANAGER, Role.ADMIN)
  getPendingLeaves() {
    return this.leaveService.getPendingLeaves();
  }

  @Post(':id/approve')
  @Roles(Role.MANAGER, Role.ADMIN)
  approve(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.leaveService.approve(id, user.id);
  }

  @Post(':id/reject')
  @Roles(Role.MANAGER, Role.ADMIN)
  reject(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body('comment') comment?: string,
  ) {
    return this.leaveService.reject(id, user.id, comment);
  }

  @Get('all')
  @Roles(Role.ADMIN)
  getAllLeaves() {
    return this.leaveService.getAllLeaves();
  }
}
