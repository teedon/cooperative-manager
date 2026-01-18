import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { StaffService } from '../staff.service';
import { StaffPermission } from '../enums/staff-permissions.enum';

@Injectable()
export class CooperativeAccessGuard implements CanActivate {
  constructor(private staffService: StaffService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const cooperativeId = request.params.cooperativeId || request.body.cooperativeId;
    const organizationId = request.params.organizationId;

    if (!user || !cooperativeId) {
      return true; // Let other guards handle auth
    }

    // Find staff record
    const staff = await this.staffService.findByUserAndOrg(user.id, organizationId);

    if (!staff) {
      return true; // Not part of organization management, let through
    }

    // Admin and those with VIEW_ALL_GROUPS permission can access all cooperatives
    if (
      staff.role === 'admin' ||
      staff.permissions.includes(StaffPermission.VIEW_ALL_GROUPS)
    ) {
      return true;
    }

    // Check if staff is assigned to this cooperative
    if (staff.permissions.includes(StaffPermission.VIEW_ASSIGNED_GROUPS_ONLY)) {
      const assignment = await this.staffService.findAssignment(staff.id, cooperativeId);

      if (!assignment) {
        throw new ForbiddenException('Access denied: Not assigned to this cooperative');
      }
    }

    request.staff = staff;
    return true;
  }
}
