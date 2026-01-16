import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StaffService } from '../staff.service';
import { StaffPermission } from '../enums/staff-permissions.enum';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private staffService: StaffService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<StaffPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const organizationId = request.params.organizationId;

    if (!user || !organizationId) {
      throw new ForbiddenException('Authentication required');
    }

    // Find staff record for this user in this organization
    const staff = await this.staffService.findByUserAndOrg(user.id, organizationId);

    if (!staff) {
      throw new ForbiddenException('Access denied: Not a member of this organization');
    }

    // Admin role has all permissions
    if (staff.role === 'admin') {
      return true;
    }

    // Check if staff has all required permissions
    const hasAllPermissions = requiredPermissions.every(permission =>
      staff.permissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Attach staff info to request for use in controllers
    request.staff = staff;

    return true;
  }
}
