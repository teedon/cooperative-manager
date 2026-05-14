import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivitiesService } from '../activities/activities.service';
import { PERMISSIONS, Permission, hasPermission, parsePermissions } from '../common/permissions';
import { PrismaService } from '../prisma/prisma.service';
import {
  ApproveFeePaymentDto,
  CreateFeeDto,
  ListFeePaymentsDto,
  RecordFeePaymentDto,
  UpdateFeeDto,
} from './dto';

@Injectable()
export class FeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  private async getMemberWithPermissions(cooperativeId: string, userId: string) {
    const member = await this.prisma.member.findFirst({
      where: {
        cooperativeId,
        userId,
        status: 'active',
      },
      select: {
        id: true,
        role: true,
        permissions: true,
        cooperativeId: true,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    return {
      ...member,
      parsedPermissions: parsePermissions(member.permissions),
    };
  }

  private checkPermission(
    member: { role: string; parsedPermissions: string[] },
    requiredPermission: Permission,
  ) {
    return hasPermission(member.role, member.parsedPermissions, requiredPermission);
  }

  private requirePermission(
    member: { role: string; parsedPermissions: string[] },
    requiredPermission: Permission,
    errorMessage: string,
  ) {
    if (!this.checkPermission(member, requiredPermission)) {
      throw new ForbiddenException(errorMessage);
    }
  }

  async createFee(cooperativeId: string, dto: CreateFeeDto, userId: string) {
    const member = await this.getMemberWithPermissions(cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.FEES_CREATE, 'You do not have permission to create fees');

    const fee = await this.prisma.cooperativeFee.create({
      data: {
        cooperativeId,
        name: dto.name,
        description: dto.description,
        amount: dto.amount,
        isActive: dto.isActive ?? true,
        createdBy: userId,
      },
    });

    await this.activitiesService.log(
      userId,
      'fee.create',
      `Created fee "${fee.name}"`,
      cooperativeId,
      { feeId: fee.id, name: fee.name, amount: fee.amount },
    );

    return fee;
  }

  async getFees(cooperativeId: string, userId: string) {
    const member = await this.getMemberWithPermissions(cooperativeId, userId);

    const fees = await this.prisma.cooperativeFee.findMany({
      where: { cooperativeId },
      include: {
        _count: {
          select: {
            payments: true,
          },
        },
        payments: {
          where: { status: 'approved' },
          select: {
            amount: true,
            memberId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return fees.map((fee) => {
      const totalPaid = fee.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const myPaid = fee.payments
        .filter((payment) => payment.memberId === member.id)
        .reduce((sum, payment) => sum + payment.amount, 0);

      return {
        ...fee,
        totalPaid,
        myPaid,
        approvedPaymentCount: fee.payments.length,
      };
    });
  }

  async updateFee(feeId: string, dto: UpdateFeeDto, userId: string) {
    const fee = await this.prisma.cooperativeFee.findUnique({ where: { id: feeId } });
    if (!fee) {
      throw new NotFoundException('Fee not found');
    }

    const member = await this.getMemberWithPermissions(fee.cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.FEES_EDIT, 'You do not have permission to edit fees');

    const updated = await this.prisma.cooperativeFee.update({
      where: { id: feeId },
      data: {
        name: dto.name,
        description: dto.description,
        amount: dto.amount,
        isActive: dto.isActive,
      },
    });

    await this.activitiesService.log(
      userId,
      'fee.update',
      `Updated fee "${updated.name}"`,
      fee.cooperativeId,
      { feeId: updated.id },
    );

    return updated;
  }

  async recordFeePayment(feeId: string, dto: RecordFeePaymentDto, userId: string) {
    const fee = await this.prisma.cooperativeFee.findUnique({ where: { id: feeId } });
    if (!fee) {
      throw new NotFoundException('Fee not found');
    }

    if (!fee.isActive) {
      throw new BadRequestException('This fee is not active');
    }

    const actor = await this.getMemberWithPermissions(fee.cooperativeId, userId);
    const targetMemberId = dto.memberId || actor.id;

    if (targetMemberId !== actor.id) {
      this.requirePermission(
        actor,
        PERMISSIONS.FEES_RECORD_FOR_OTHERS,
        'You do not have permission to record fee payments for other members',
      );
    }

    const targetMember = await this.prisma.member.findFirst({
      where: {
        id: targetMemberId,
        cooperativeId: fee.cooperativeId,
        status: 'active',
      },
      select: {
        id: true,
      },
    });

    if (!targetMember) {
      throw new NotFoundException('Target member not found in this cooperative');
    }

    const payment = await this.prisma.cooperativeFeePayment.create({
      data: {
        feeId,
        memberId: targetMember.id,
        amount: dto.amount,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
        paymentMethod: dto.paymentMethod,
        paymentReference: dto.paymentReference,
        receiptUrl: dto.receiptUrl,
        notes: dto.notes,
        status: 'pending',
        recordedBy: userId,
      },
      include: {
        fee: true,
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    await this.activitiesService.log(
      userId,
      'fee.payment.record',
      `Recorded fee payment of ₦${dto.amount.toLocaleString()} for "${fee.name}"`,
      fee.cooperativeId,
      { feeId: fee.id, paymentId: payment.id, memberId: targetMember.id, amount: dto.amount },
    );

    return payment;
  }

  async getFeePayments(feeId: string, query: ListFeePaymentsDto, userId: string) {
    const fee = await this.prisma.cooperativeFee.findUnique({ where: { id: feeId } });
    if (!fee) {
      throw new NotFoundException('Fee not found');
    }

    const actor = await this.getMemberWithPermissions(fee.cooperativeId, userId);
    const canViewAll =
      this.checkPermission(actor, PERMISSIONS.FEES_VIEW) ||
      this.checkPermission(actor, PERMISSIONS.FEES_APPROVE_PAYMENTS);

    const where: {
      feeId: string;
      status?: 'pending' | 'approved' | 'rejected';
      memberId?: string;
    } = {
      feeId,
      status: query.status,
    };

    if (query.memberId) {
      if (!canViewAll && query.memberId !== actor.id) {
        throw new ForbiddenException('You do not have permission to view other member fee payments');
      }
      where.memberId = query.memberId;
    } else if (!canViewAll) {
      where.memberId = actor.id;
    }

    return this.prisma.cooperativeFeePayment.findMany({
      where,
      include: {
        fee: true,
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingPayments(cooperativeId: string, userId: string) {
    const actor = await this.getMemberWithPermissions(cooperativeId, userId);
    this.requirePermission(
      actor,
      PERMISSIONS.FEES_APPROVE_PAYMENTS,
      'You do not have permission to approve fee payments',
    );

    return this.prisma.cooperativeFeePayment.findMany({
      where: {
        status: 'pending',
        fee: { cooperativeId },
      },
      include: {
        fee: true,
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getMyPayments(cooperativeId: string, userId: string) {
    const member = await this.getMemberWithPermissions(cooperativeId, userId);

    return this.prisma.cooperativeFeePayment.findMany({
      where: {
        memberId: member.id,
        fee: { cooperativeId },
      },
      include: {
        fee: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveFeePayment(paymentId: string, dto: ApproveFeePaymentDto, userId: string) {
    const payment = await this.prisma.cooperativeFeePayment.findUnique({
      where: { id: paymentId },
      include: {
        fee: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Fee payment not found');
    }

    const actor = await this.getMemberWithPermissions(payment.fee.cooperativeId, userId);
    this.requirePermission(
      actor,
      PERMISSIONS.FEES_APPROVE_PAYMENTS,
      'You do not have permission to approve fee payments',
    );

    if (dto.status === 'rejected' && !dto.rejectionReason?.trim()) {
      throw new BadRequestException('Rejection reason is required when rejecting a payment');
    }

    const updated = await this.prisma.cooperativeFeePayment.update({
      where: { id: paymentId },
      data: {
        status: dto.status,
        rejectionReason: dto.status === 'rejected' ? dto.rejectionReason : null,
        approvedBy: dto.status === 'approved' ? userId : null,
        approvedAt: dto.status === 'approved' ? new Date() : null,
      },
      include: {
        fee: true,
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    await this.activitiesService.log(
      userId,
      `fee.payment.${dto.status}`,
      `${dto.status === 'approved' ? 'Approved' : 'Rejected'} fee payment for "${updated.fee.name}"`,
      updated.fee.cooperativeId,
      {
        feeId: updated.feeId,
        paymentId: updated.id,
        memberId: updated.memberId,
        rejectionReason: updated.rejectionReason,
      },
    );

    return updated;
  }
}
