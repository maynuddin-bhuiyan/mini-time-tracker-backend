import { IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateRoleDto {
  @IsEnum(['ADMIN', 'MANAGER', 'STAFF'])
  role: Role;
}
