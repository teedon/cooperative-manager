import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateLoanTypeDto, UpdateLoanTypeDto } from './dto/loan-type.dto';
import { RequestLoanDto, InitiateLoanDto, ApproveLoanDto, RejectLoanDto, RecordRepaymentDto } from './dto/loan.dto';
import { PERMISSIONS, hasPermission, parsePermissions, Permission } from '../common/permissions';

@Injectable()
export class LoansService {
  constructor(
    private prisma: PrismaService,
    private activitiesService: ActivitiesService,
    private notificationsService: NotificationsService,
  ) {}

  // ==================== LOAN TYPES ====================

  async createLoanType(cooperativeId: string, dto: CreateLoanTypeDto, requestingUserId: string) {
    // Validate permission
    const member = await this.validatePermission(cooperativeId, requestingUserId, PERMISSIONS.LOANS_CONFIGURE);

    // Check for duplicate name
    const existing = await this.prisma.loanType.findUnique({
      where: { cooperativeId_name: { cooperativeId, name: dto.name } },
    });
    if (existing) {
      throw new BadRequestException(`Loan type "${dto.name}" already exists`);
    }

    // Validate amount and duration ranges
    if (dto.minAmount > dto.maxAmount) {
      throw new BadRequestException('Minimum amount cannot exceed maximum amount');
    }
    if (dto.minDuration > dto.maxDuration) {
      throw new BadRequestException('Minimum duration cannot exceed maximum duration');
    }

    const loanType = await this.prisma.loanType.create({
      data: {
        cooperativeId,
        name: dto.name,
        description: dto.description,
        minAmount: dto.minAmount,
        maxAmount: dto.maxAmount,
        minDuration: dto.minDuration,
        maxDuration: dto.maxDuration,
        interestRate: dto.interestRate,
        interestType: dto.interestType,
        minMembershipDuration: dto.minMembershipDuration,
        minSavingsBalance: dto.minSavingsBalance,
        maxActiveLoans: dto.maxActiveLoans ?? 1,
        requiresGuarantor: dto.requiresGuarantor ?? false,
        minGuarantors: dto.minGuarantors ?? 0,
        isActive: dto.isActive ?? true,
        requiresApproval: dto.requiresApproval ?? true,
        createdBy: requestingUserId,
      },
    });

    await this.activitiesService.create({
      userId: requestingUserId,
      cooperativeId,
      action: 'loan_type_created',
      description: `Created loan type: ${dto.name}`,
    });

    return loanType;
  }

  async updateLoanType(cooperativeId: string, loanTypeId: string, dto: UpdateLoanTypeDto, requestingUserId: string) {
    await this.validatePermission(cooperativeId, requestingUserId, PERMISSIONS.LOANS_CONFIGURE);

    const loanType = await this.prisma.loanType.findFirst({
      where: { id: loanTypeId, cooperativeId },
    });
    if (!loanType) {
      throw new NotFoundException('Loan type not found');
    }

    // Check for duplicate name if changing
    if (dto.name && dto.name !== loanType.name) {
      const existing = await this.prisma.loanType.findUnique({
        where: { cooperativeId_name: { cooperativeId, name: dto.name } },
      });
      if (existing) {
        throw new BadRequestException(`Loan type "${dto.name}" already exists`);
      }
    }

    // Validate ranges if provided
    const minAmount = dto.minAmount ?? loanType.minAmount;
    const maxAmount = dto.maxAmount ?? loanType.maxAmount;
    const minDuration = dto.minDuration ?? loanType.minDuration;
    const maxDuration = dto.maxDuration ?? loanType.maxDuration;

    if (minAmount > maxAmount) {
      throw new BadRequestException('Minimum amount cannot exceed maximum amount');
    }
    if (minDuration > maxDuration) {
      throw new BadRequestException('Minimum duration cannot exceed maximum duration');
    }

    const updated = await this.prisma.loanType.update({
      where: { id: loanTypeId },
      data: dto,
    });

    await this.activitiesService.create({
      userId: requestingUserId,
      cooperativeId,
      action: 'loan_type_updated',
      description: `Updated loan type: ${updated.name}`,
    });

    return updated;
  }

  async getLoanTypes(cooperativeId: string, requestingUserId: string) {
    await this.validateMembership(cooperativeId, requestingUserId);

    return this.prisma.loanType.findMany({
      where: { cooperativeId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { loans: true },
        },
      },
    });
  }

  async getLoanType(cooperativeId: string, loanTypeId: string, requestingUserId: string) {
    await this.validateMembership(cooperativeId, requestingUserId);

    const loanType = await this.prisma.loanType.findFirst({
      where: { id: loanTypeId, cooperativeId },
      include: {
        _count: {
          select: { loans: true },
        },
      },
    });

    if (!loanType) {
      throw new NotFoundException('Loan type not found');
    }

    return loanType;
  }

  async deleteLoanType(cooperativeId: string, loanTypeId: string, requestingUserId: string) {
    await this.validatePermission(cooperativeId, requestingUserId, PERMISSIONS.LOANS_CONFIGURE);

    const loanType = await this.prisma.loanType.findFirst({
      where: { id: loanTypeId, cooperativeId },
      include: { _count: { select: { loans: true } } },
    });

    if (!loanType) {
      throw new NotFoundException('Loan type not found');
    }

    if (loanType._count.loans > 0) {
      throw new BadRequestException('Cannot delete loan type with existing loans. Deactivate it instead.');
    }

    await this.prisma.loanType.delete({ where: { id: loanTypeId } });

    await this.activitiesService.create({
      userId: requestingUserId,
      cooperativeId,
      action: 'loan_type_deleted',
      description: `Deleted loan type: ${loanType.name}`,
    });

    return { message: 'Loan type deleted successfully' };
  }

  // ==================== LOAN REQUESTS ====================

  async requestLoan(cooperativeId: string, dto: RequestLoanDto, requestingUserId: string) {
    const member = await this.validateMembership(cooperativeId, requestingUserId);

    let interestRate = dto.interestRate ?? 0;
    let loanType: any = null;

    // If loan type specified, validate and get settings
    if (dto.loanTypeId) {
      loanType = await this.prisma.loanType.findFirst({
        where: { id: dto.loanTypeId, cooperativeId, isActive: true },
      });

      if (!loanType) {
        throw new BadRequestException('Selected loan type is not available');
      }

      // Validate against loan type limits
      if (dto.amount < loanType.minAmount || dto.amount > loanType.maxAmount) {
        throw new BadRequestException(
          `Amount must be between ₦${loanType.minAmount.toLocaleString()} and ₦${loanType.maxAmount.toLocaleString()}`
        );
      }
      if (dto.duration < loanType.minDuration || dto.duration > loanType.maxDuration) {
        throw new BadRequestException(
          `Duration must be between ${loanType.minDuration} and ${loanType.maxDuration} months`
        );
      }

      // Check eligibility
      await this.checkLoanEligibility(member.id, loanType);

      interestRate = loanType.interestRate;
    }

    // Calculate loan details
    const { interestAmount, monthlyRepayment, totalRepayment } = this.calculateLoanDetails(
      dto.amount,
      interestRate,
      dto.duration,
      loanType?.interestType || 'flat'
    );

    // Create loan
    const loan = await this.prisma.loan.create({
      data: {
        cooperativeId,
        memberId: member.id,
        loanTypeId: dto.loanTypeId,
        amount: dto.amount,
        purpose: dto.purpose,
        duration: dto.duration,
        interestRate,
        interestAmount,
        monthlyRepayment,
        totalRepayment,
        outstandingBalance: totalRepayment,
        status: 'pending',
        initiatedBy: 'member',
        requestedAt: new Date(),
      },
      include: {
        member: {
          include: { user: true },
        },
        loanType: true,
      },
    });

    await this.activitiesService.create({
      userId: requestingUserId,
      cooperativeId,
      action: 'loan_requested',
      description: `Requested loan of ₦${dto.amount.toLocaleString()} for ${dto.purpose}`,
    });

    // Notify cooperative admins about new loan request
    const memberName = loan.member.user 
      ? `${loan.member.user.firstName} ${loan.member.user.lastName}`
      : 'A member';
    
    await this.notificationsService.notifyCooperativeAdmins(
      cooperativeId,
      'loan_requested',
      'New Loan Request',
      `${memberName} has requested a loan of ₦${dto.amount.toLocaleString()}`,
      { loanId: loan.id, amount: dto.amount, purpose: dto.purpose },
      [requestingUserId], // Exclude the requester
    );

    return loan;
  }

  async initiateLoanForMember(cooperativeId: string, dto: InitiateLoanDto, requestingUserId: string) {
    await this.validatePermission(cooperativeId, requestingUserId, PERMISSIONS.LOANS_APPROVE);

    // Validate target member
    const targetMember = await this.prisma.member.findFirst({
      where: { id: dto.memberId, cooperativeId, status: 'active' },
    });
    if (!targetMember) {
      throw new BadRequestException('Member not found or not active');
    }

    let interestRate = dto.interestRate ?? 0;
    let loanType: any = null;

    if (dto.loanTypeId) {
      loanType = await this.prisma.loanType.findFirst({
        where: { id: dto.loanTypeId, cooperativeId },
      });
      if (loanType) {
        interestRate = dto.interestRate ?? loanType.interestRate;
      }
    }

    // Calculate loan details
    const { interestAmount, monthlyRepayment, totalRepayment } = this.calculateLoanDetails(
      dto.amount,
      interestRate,
      dto.duration,
      loanType?.interestType || 'flat'
    );

    // Create and auto-approve loan initiated by admin
    const loan = await this.prisma.loan.create({
      data: {
        cooperativeId,
        memberId: dto.memberId,
        loanTypeId: dto.loanTypeId,
        amount: dto.amount,
        purpose: dto.purpose,
        duration: dto.duration,
        interestRate,
        interestAmount,
        monthlyRepayment,
        totalRepayment,
        outstandingBalance: totalRepayment,
        status: 'approved', // Auto-approved for admin-initiated loans
        initiatedBy: 'admin',
        initiatedByUserId: requestingUserId,
        deductionStartDate: dto.deductionStartDate ? new Date(dto.deductionStartDate) : null,
        requestedAt: new Date(),
        reviewedBy: requestingUserId,
        reviewedAt: new Date(),
      },
      include: {
        member: {
          include: { user: true },
        },
        loanType: true,
      },
    });

    await this.activitiesService.create({
      userId: requestingUserId,
      cooperativeId,
      action: 'loan_initiated_by_admin',
      description: `Initiated and approved loan of ₦${dto.amount.toLocaleString()} for member`,
    });

    return loan;
  }

  async approveLoan(loanId: string, dto: ApproveLoanDto, requestingUserId: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { member: { include: { user: true } } },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    await this.validatePermission(loan.cooperativeId, requestingUserId, PERMISSIONS.LOANS_APPROVE);

    if (loan.status !== 'pending') {
      throw new BadRequestException(`Cannot approve loan with status: ${loan.status}`);
    }

    const updated = await this.prisma.loan.update({
      where: { id: loanId },
      data: {
        status: 'approved',
        reviewedBy: requestingUserId,
        reviewedAt: new Date(),
        deductionStartDate: dto.deductionStartDate ? new Date(dto.deductionStartDate) : null,
      },
      include: {
        member: { include: { user: true } },
        loanType: true,
      },
    });

    await this.activitiesService.create({
      userId: requestingUserId,
      cooperativeId: loan.cooperativeId,
      action: 'loan_approved',
      description: `Approved loan of ₦${loan.amount.toLocaleString()}`,
    });

    // Notify the member that their loan was approved
    if (loan.member.userId) {
      await this.notificationsService.createNotification({
        userId: loan.member.userId,
        cooperativeId: loan.cooperativeId,
        type: 'loan_approved',
        title: 'Loan Approved! 🎉',
        body: `Your loan request of ₦${loan.amount.toLocaleString()} has been approved.`,
        data: { loanId: loan.id },
        actionType: 'navigate',
        actionRoute: 'LoanDetail',
        actionParams: { loanId: loan.id },
      });
    }

    return updated;
  }

  async rejectLoan(loanId: string, dto: RejectLoanDto, requestingUserId: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    await this.validatePermission(loan.cooperativeId, requestingUserId, PERMISSIONS.LOANS_REJECT);

    if (loan.status !== 'pending') {
      throw new BadRequestException(`Cannot reject loan with status: ${loan.status}`);
    }

    const updated = await this.prisma.loan.update({
      where: { id: loanId },
      data: {
        status: 'rejected',
        reviewedBy: requestingUserId,
        reviewedAt: new Date(),
        rejectionReason: dto.reason,
      },
      include: {
        member: { include: { user: true } },
        loanType: true,
      },
    });

    await this.activitiesService.create({
      userId: requestingUserId,
      cooperativeId: loan.cooperativeId,
      action: 'loan_rejected',
      description: `Rejected loan of ₦${loan.amount.toLocaleString()}: ${dto.reason}`,
    });

    // Notify the member that their loan was rejected
    if (updated.member.userId) {
      await this.notificationsService.createNotification({
        userId: updated.member.userId,
        cooperativeId: loan.cooperativeId,
        type: 'loan_rejected',
        title: 'Loan Request Declined',
        body: `Your loan request of ₦${loan.amount.toLocaleString()} was declined. Reason: ${dto.reason}`,
        data: { loanId: loan.id, reason: dto.reason },
        actionType: 'navigate',
        actionRoute: 'LoanDetail',
        actionParams: { loanId: loan.id },
      });
    }

    return updated;
  }

  async disburseLoan(loanId: string, requestingUserId: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { loanType: true },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    await this.validatePermission(loan.cooperativeId, requestingUserId, PERMISSIONS.LOANS_APPROVE);

    if (loan.status !== 'approved') {
      throw new BadRequestException(`Cannot disburse loan with status: ${loan.status}`);
    }

    // Generate repayment schedule
    const schedules = this.generateRepaymentSchedule(loan);

    // Update loan and create schedules in transaction
    const [updated] = await this.prisma.$transaction([
      this.prisma.loan.update({
        where: { id: loanId },
        data: {
          status: 'disbursed',
          amountDisbursed: loan.amount,
          disbursedAt: new Date(),
        },
        include: {
          member: { include: { user: true } },
          loanType: true,
          repaymentSchedules: true,
        },
      }),
      ...schedules.map((schedule) =>
        this.prisma.loanRepaymentSchedule.create({ data: schedule })
      ),
    ]);

    // Add ledger entry
    await this.prisma.ledgerEntry.create({
      data: {
        cooperativeId: loan.cooperativeId,
        memberId: loan.memberId,
        type: 'loan_disbursement',
        amount: -loan.amount, // Negative because money goes out to member
        balanceAfter: 0, // Will be calculated properly
        referenceId: loan.id,
        referenceType: 'loan',
        description: `Loan disbursement: ₦${loan.amount.toLocaleString()}`,
        createdBy: requestingUserId,
      },
    });

    await this.activitiesService.create({
      userId: requestingUserId,
      cooperativeId: loan.cooperativeId,
      action: 'loan_disbursed',
      description: `Disbursed loan of ₦${loan.amount.toLocaleString()}`,
    });

    // Notify the member that their loan was disbursed
    if (updated.member.userId) {
      await this.notificationsService.createNotification({
        userId: updated.member.userId,
        cooperativeId: loan.cooperativeId,
        type: 'loan_disbursed',
        title: 'Loan Disbursed',
        body: `Your loan of ₦${loan.amount.toLocaleString()} has been disbursed. First repayment is due on ${schedules[0]?.dueDate.toLocaleDateString()}.`,
        data: { loanId: loan.id },
      });
    }

    // Refetch to include schedules
    return this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        member: { include: { user: true } },
        loanType: true,
        repaymentSchedules: { orderBy: { installmentNumber: 'asc' } },
      },
    });
  }

  async recordRepayment(loanId: string, dto: RecordRepaymentDto, requestingUserId: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { repaymentSchedules: { orderBy: { installmentNumber: 'asc' } } },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    await this.validatePermission(loan.cooperativeId, requestingUserId, PERMISSIONS.LOANS_APPROVE);

    if (!['disbursed', 'repaying'].includes(loan.status)) {
      throw new BadRequestException('Loan is not in a repayable state');
    }

    // Find pending schedules and apply payment
    let remainingAmount = dto.amount;
    const schedulesToUpdate: string[] = [];

    for (const schedule of loan.repaymentSchedules) {
      if (remainingAmount <= 0) break;
      if (schedule.status === 'paid') continue;

      const amountDue = schedule.totalAmount - schedule.paidAmount;
      const amountToPay = Math.min(remainingAmount, amountDue);

      schedulesToUpdate.push(schedule.id);
      remainingAmount -= amountToPay;

      await this.prisma.loanRepaymentSchedule.update({
        where: { id: schedule.id },
        data: {
          paidAmount: schedule.paidAmount + amountToPay,
          status: schedule.paidAmount + amountToPay >= schedule.totalAmount ? 'paid' : 'partial',
          paidAt: schedule.paidAmount + amountToPay >= schedule.totalAmount ? new Date() : null,
        },
      });
    }

    // Update loan totals
    const newAmountRepaid = loan.amountRepaid + dto.amount;
    const newOutstanding = loan.totalRepayment - newAmountRepaid;
    const newStatus = newOutstanding <= 0 ? 'completed' : 'repaying';

    const updated = await this.prisma.loan.update({
      where: { id: loanId },
      data: {
        amountRepaid: newAmountRepaid,
        outstandingBalance: Math.max(0, newOutstanding),
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date() : null,
      },
      include: {
        member: { include: { user: true } },
        loanType: true,
        repaymentSchedules: { orderBy: { installmentNumber: 'asc' } },
      },
    });

    // Add ledger entry
    await this.prisma.ledgerEntry.create({
      data: {
        cooperativeId: loan.cooperativeId,
        memberId: loan.memberId,
        type: 'loan_repayment',
        amount: dto.amount, // Positive because money comes in
        balanceAfter: 0,
        referenceId: loan.id,
        referenceType: 'loan',
        description: `Loan repayment: ₦${dto.amount.toLocaleString()}`,
        createdBy: requestingUserId,
      },
    });

    await this.activitiesService.create({
      userId: requestingUserId,
      cooperativeId: loan.cooperativeId,
      action: 'loan_repayment_recorded',
      description: `Recorded loan repayment of ₦${dto.amount.toLocaleString()}`,
    });

    return updated;
  }

  // ==================== LOAN QUERIES ====================

  async getLoans(cooperativeId: string, requestingUserId: string) {
    await this.validateMembership(cooperativeId, requestingUserId);

    return this.prisma.loan.findMany({
      where: { cooperativeId },
      include: {
        member: { include: { user: true } },
        loanType: true,
      },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async getLoan(loanId: string, requestingUserId: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        member: { include: { user: true } },
        loanType: true,
        repaymentSchedules: { orderBy: { installmentNumber: 'asc' } },
      },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    await this.validateMembership(loan.cooperativeId, requestingUserId);

    return loan;
  }

  async getPendingLoans(cooperativeId: string, requestingUserId: string) {
    await this.validatePermission(cooperativeId, requestingUserId, PERMISSIONS.LOANS_VIEW);

    return this.prisma.loan.findMany({
      where: { cooperativeId, status: 'pending' },
      include: {
        member: { include: { user: true } },
        loanType: true,
      },
      orderBy: { requestedAt: 'asc' },
    });
  }

  async getMyLoans(cooperativeId: string, requestingUserId: string) {
    const member = await this.validateMembership(cooperativeId, requestingUserId);

    return this.prisma.loan.findMany({
      where: { memberId: member.id },
      include: {
        loanType: true,
        repaymentSchedules: { orderBy: { installmentNumber: 'asc' } },
      },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async getRepaymentSchedules(loanId: string, requestingUserId: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    await this.validateMembership(loan.cooperativeId, requestingUserId);

    return this.prisma.loanRepaymentSchedule.findMany({
      where: { loanId },
      orderBy: { installmentNumber: 'asc' },
    });
  }

  // ==================== HELPERS ====================

  private async validateMembership(cooperativeId: string, userId: string) {
    const member = await this.prisma.member.findFirst({
      where: { cooperativeId, userId, status: 'active' },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    return member;
  }

  private async validatePermission(cooperativeId: string, userId: string, permission: Permission) {
    const member = await this.prisma.member.findFirst({
      where: { cooperativeId, userId, status: 'active' },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    const permissions = parsePermissions(member.permissions);
    if (!hasPermission(member.role, permissions, permission)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    return member;
  }

  private async checkLoanEligibility(memberId: string, loanType: any) {
    // Check active loans limit
    if (loanType.maxActiveLoans) {
      const activeLoans = await this.prisma.loan.count({
        where: {
          memberId,
          loanTypeId: loanType.id,
          status: { in: ['pending', 'approved', 'disbursed', 'repaying'] },
        },
      });
      if (activeLoans >= loanType.maxActiveLoans) {
        throw new BadRequestException(
          `Maximum of ${loanType.maxActiveLoans} active loan(s) allowed for this loan type`
        );
      }
    }

    // TODO: Add more eligibility checks (membership duration, savings balance, etc.)
  }

  private calculateLoanDetails(amount: number, interestRate: number, duration: number, interestType: string) {
    let interestAmount: number;
    let monthlyRepayment: number;
    let totalRepayment: number;

    if (interestType === 'reducing_balance') {
      // Reducing balance calculation
      const monthlyRate = interestRate / 100 / 12;
      if (monthlyRate === 0) {
        monthlyRepayment = Math.ceil(amount / duration);
        interestAmount = 0;
      } else {
        monthlyRepayment = Math.ceil(
          (amount * monthlyRate * Math.pow(1 + monthlyRate, duration)) /
            (Math.pow(1 + monthlyRate, duration) - 1)
        );
        interestAmount = monthlyRepayment * duration - amount;
      }
      totalRepayment = monthlyRepayment * duration;
    } else {
      // Flat rate calculation
      interestAmount = Math.ceil((amount * interestRate * duration) / (100 * 12));
      totalRepayment = amount + interestAmount;
      monthlyRepayment = Math.ceil(totalRepayment / duration);
    }

    return { interestAmount, monthlyRepayment, totalRepayment };
  }

  private generateRepaymentSchedule(loan: any) {
    const schedules: any[] = [];
    const startDate = loan.deductionStartDate || loan.disbursedAt || new Date();
    
    let remainingPrincipal = loan.amount;
    const monthlyRate = loan.interestRate / 100 / 12;

    for (let i = 1; i <= loan.duration; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      let principalAmount: number;
      let interestAmount: number;

      if (loan.loanType?.interestType === 'reducing_balance' && monthlyRate > 0) {
        // Reducing balance: interest on remaining principal
        interestAmount = Math.ceil(remainingPrincipal * monthlyRate);
        principalAmount = loan.monthlyRepayment - interestAmount;
        remainingPrincipal -= principalAmount;
      } else {
        // Flat rate: evenly distributed
        principalAmount = Math.ceil(loan.amount / loan.duration);
        interestAmount = Math.ceil(loan.interestAmount / loan.duration);
      }

      // Adjust last installment to match exactly
      if (i === loan.duration) {
        const totalScheduled = schedules.reduce((sum, s) => sum + s.totalAmount, 0);
        const lastTotal = loan.totalRepayment - totalScheduled;
        principalAmount = lastTotal - interestAmount;
      }

      schedules.push({
        loanId: loan.id,
        installmentNumber: i,
        dueDate,
        principalAmount: Math.max(0, principalAmount),
        interestAmount: Math.max(0, interestAmount),
        totalAmount: Math.max(0, principalAmount + interestAmount),
        status: 'pending',
      });
    }

    return schedules;
  }
}
