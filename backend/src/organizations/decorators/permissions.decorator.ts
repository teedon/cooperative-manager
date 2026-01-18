import { SetMetadata } from '@nestjs/common';
import { StaffPermission } from '../enums/staff-permissions.enum';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: StaffPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
