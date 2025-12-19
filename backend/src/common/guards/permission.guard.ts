import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { Permission, hasPermission, parsePermissions } from '../permissions';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to set required permissions for an endpoint
 * Usage: @RequirePermissions(PERMISSIONS.CONTRIBUTIONS_CREATE_PLAN)
 */
export function RequirePermissions(...permissions: Permission[]) {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(PERMISSIONS_KEY, permissions, descriptor.value);
    }
    return descriptor;
  };
}

/**
 * Permission guard that checks if user has required permissions
 * Requires cooperativeId to be present in params or body
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<Permission[]>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );

    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get cooperative ID from various sources
    const cooperativeId = 
      request.params.cooperativeId || 
      request.params.id ||
      request.body.cooperativeId ||
      request.query.cooperativeId;

    if (!cooperativeId) {
      // Try to get cooperative ID from plan or subscription
      const planId = request.params.planId;
      const subscriptionId = request.params.subscriptionId;
      const scheduleId = request.params.scheduleId;
      const paymentId = request.params.paymentId;

      let resolvedCooperativeId: string | null = null;

      if (planId) {
        const plan = await this.prisma.contributionPlan.findUnique({
          where: { id: planId },
          select: { cooperativeId: true },
        });
        resolvedCooperativeId = plan?.cooperativeId || null;
      } else if (subscriptionId) {
        const subscription = await this.prisma.contributionSubscription.findUnique({
          where: { id: subscriptionId },
          include: { plan: { select: { cooperativeId: true } } },
        });
        resolvedCooperativeId = subscription?.plan?.cooperativeId || null;
      } else if (scheduleId) {
        const schedule = await this.prisma.paymentSchedule.findUnique({
          where: { id: scheduleId },
          include: { 
            subscription: { 
              include: { plan: { select: { cooperativeId: true } } } 
            } 
          },
        });
        resolvedCooperativeId = schedule?.subscription?.plan?.cooperativeId || null;
      } else if (paymentId) {
        const payment = await this.prisma.contributionPayment.findUnique({
          where: { id: paymentId },
          include: { 
            subscription: { 
              include: { plan: { select: { cooperativeId: true } } } 
            } 
          },
        });
        resolvedCooperativeId = payment?.subscription?.plan?.cooperativeId || null;
      }

      if (!resolvedCooperativeId) {
        throw new ForbiddenException('Could not determine cooperative for permission check');
      }

      // Store resolved cooperative ID for later use
      request.resolvedCooperativeId = resolvedCooperativeId;
      return this.checkPermissions(user.id, resolvedCooperativeId, requiredPermissions);
    }

    return this.checkPermissions(user.id, cooperativeId, requiredPermissions);
  }

  private async checkPermissions(
    userId: string,
    cooperativeId: string,
    requiredPermissions: Permission[],
  ): Promise<boolean> {
    // Get user's membership and permissions
    const member = await this.prisma.member.findFirst({
      where: {
        userId,
        cooperativeId,
        status: 'active',
      },
      select: {
        id: true,
        role: true,
        permissions: true,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    const userPermissions = parsePermissions(member.permissions);

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every((perm) =>
      hasPermission(member.role, userPermissions, perm),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    return true;
  }
}
