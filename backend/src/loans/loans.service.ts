import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateLoanTypeDto, UpdateLoanTypeDto } from './dto/loan-type.dto';
import { RequestLoanDto, InitiateLoanDto, ApproveLoanDto, RejectLoanDto, RecordRepaymentDto } from './dto/loan.dto';
import { PERMISSIONS, hasPermission, parsePermissions, Permission } from '../common/permissions';
import {
  sendEmail,
  generateLoanRequestEmailTemplate,
  generateLoanApprovedEmailTemplate,
  generateLoanRejectedEmailTemplate,
  generateLoanDisbursedEmailTemplate,
  generateNewLoanRequestNotificationEmailTemplate,
} from '../services/mailer';

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
        applicationFee: dto.applicationFee ?? null,
        deductInterestUpfront: dto.deductInterestUpfront ?? false,
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
      loanType?.interestType || 'flat',
      loanType?.deductInterestUpfront || false
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

    // Create guarantor records if provided
    if (dto.guarantorIds && dto.guarantorIds.length > 0) {
      await this.prisma.loanGuarantor.createMany({
        data: dto.guarantorIds.map(guarantorMemberId => ({
          loanId: loan.id,
          guarantorMemberId,
          status: 'pending',
        })),
      });

      // Notify each guarantor
      for (const guarantorMemberId of dto.guarantorIds) {
        const guarantorMember = await this.prisma.member.findUnique({
          where: { id: guarantorMemberId },
          include: { user: true },
        });

        if (guarantorMember?.userId && loan.member.user) {
          await this.notificationsService.createNotification({
            userId: guarantorMember.userId,
            cooperativeId,
            type: 'loan_guarantor_request',
            title: 'Guarantor Request',
            body: `${loan.member.user.firstName} ${loan.member.user.lastName} has requested you to guarantee their loan of ${dto.amount.toLocaleString()}`,
            data: {
              loanId: loan.id,
              amount: dto.amount,
              requesterName: `${loan.member.user.firstName} ${loan.member.user.lastName}`,
            },
            actionType: 'view',
            actionRoute: `/loans/${loan.id}/guarantor-response`,
          });
        }
      }
    }

    // Create KYC document records if provided
    if (dto.kycDocuments && dto.kycDocuments.length > 0) {
      await this.prisma.loanKycDocument.createMany({
        data: dto.kycDocuments.map(doc => ({
          loanId: loan.id,
          documentType: doc.type,
          documentUrl: doc.documentUrl,
          fileName: doc.fileName,
          fileSize: 0,
          mimeType: doc.mimeType || 'application/pdf',
          status: 'pending',
          uploadedAt: new Date(),
        })),
      });
    }

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

    // Get cooperative name for emails
    const cooperative = await this.prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      select: { name: true },
    });

    // Send confirmation email to the member
    if (loan.member.user?.email) {
      sendEmail(
        loan.member.user.email,
        'Loan Request Submitted - CoopManager',
        generateLoanRequestEmailTemplate(
          memberName,
          cooperative?.name || 'Your Cooperative',
          dto.amount,
          dto.purpose,
          dto.duration,
        ),
      ).catch(err => console.error('Failed to send loan request email:', err));
    }

    // Notify admins via email
    const admins = await this.prisma.member.findMany({
      where: {
        cooperativeId,
        status: 'active',
        role: { in: ['admin', 'owner'] },
        userId: { not: requestingUserId },
      },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    });

    for (const admin of admins) {
      if (admin.user?.email) {
        sendEmail(
          admin.user.email,
          'New Loan Request Pending - CoopManager',
          generateNewLoanRequestNotificationEmailTemplate(
            `${admin.user.firstName} ${admin.user.lastName}`,
            cooperative?.name || 'Your Cooperative',
            memberName,
            dto.amount,
            dto.purpose,
          ),
        ).catch(err => console.error('Failed to send admin notification email:', err));
      }
    }

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
      loanType?.interestType || 'flat',
      loanType?.deductInterestUpfront || false
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
      include: { 
        member: { include: { user: true } },
        loanType: true,
        approvals: true,
      },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    await this.validatePermission(loan.cooperativeId, requestingUserId, PERMISSIONS.LOANS_APPROVE);

    if (loan.status !== 'pending') {
      throw new BadRequestException(`Cannot approve loan with status: ${loan.status}`);
    }

    // Check if this user has already approved
    const existingApproval = loan.approvals.find(a => a.approverUserId === requestingUserId);
    if (existingApproval) {
      throw new BadRequestException('You have already approved this loan');
    }

    // Create approval record
    await this.prisma.loanApproval.create({
      data: {
        loanId,
        approverUserId: requestingUserId,
        decision: 'approved',
        comments: dto.notes,
      },
    });

    // Check if loan type requires multiple approvals
    let shouldApproveLoan = true;
    if (loan.loanType?.requiresMultipleApprovals) {
      const minApprovers = loan.loanType.minApprovers || 2;
      const currentApprovals = loan.approvals.length + 1; // Including the new approval
      
      shouldApproveLoan = currentApprovals >= minApprovers;
    }

    // Update loan status if all approvals are met
    const updateData: any = {
      reviewedBy: requestingUserId,
      reviewedAt: new Date(),
    };

    if (shouldApproveLoan) {
      updateData.status = 'approved';
      updateData.deductionStartDate = dto.deductionStartDate ? new Date(dto.deductionStartDate) : null;
    }

    const updated = await this.prisma.loan.update({
      where: { id: loanId },
      data: updateData,
      include: {
        member: { include: { user: true } },
        loanType: true,
        approvals: {
          include: {
            approver: true,
          },
        },
      },
    });

    await this.activitiesService.create({
      userId: requestingUserId,
      cooperativeId: loan.cooperativeId,
      action: shouldApproveLoan ? 'loan_approved' : 'loan_approval_added',
      description: shouldApproveLoan 
        ? `Approved loan of ₦${loan.amount.toLocaleString()}`
        : `Added approval for loan of ₦${loan.amount.toLocaleString()}`,
    });

    // Notify the member
    if (loan.member.userId) {
      if (shouldApproveLoan) {
        // Full approval notification
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
      } else {
        // Partial approval notification
        const approver = await this.prisma.user.findUnique({ where: { id: requestingUserId } });
        const remainingApprovals = (loan.loanType?.minApprovers || 2) - (loan.approvals.length + 1);
        await this.notificationsService.createNotification({
          userId: loan.member.userId,
          cooperativeId: loan.cooperativeId,
          type: 'loan_approval_progress',
          title: 'Loan Approval Progress',
          body: `${approver?.firstName} ${approver?.lastName} approved your loan. ${remainingApprovals} more approval(s) needed.`,
          data: { loanId: loan.id },
          actionType: 'navigate',
          actionRoute: 'LoanDetail',
          actionParams: { loanId: loan.id },
        });
      }
    }

    // Send approval email only if fully approved
    if (shouldApproveLoan && updated.member.user?.email) {
      const cooperative = await this.prisma.cooperative.findUnique({
        where: { id: loan.cooperativeId },
        select: { name: true },
      });
      const memberName = `${updated.member.user.firstName} ${updated.member.user.lastName}`;
      
      sendEmail(
        updated.member.user.email,
        'Loan Approved! - CoopManager',
        generateLoanApprovedEmailTemplate(
          memberName,
          cooperative?.name || 'Your Cooperative',
          loan.amount,
          loan.interestRate,
          loan.duration,
          loan.monthlyRepayment,
          loan.totalRepayment,
        ),
      ).catch(err => console.error('Failed to send loan approval email:', err));
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

    // Send rejection email to the member
    if (updated.member.user?.email) {
      const cooperative = await this.prisma.cooperative.findUnique({
        where: { id: loan.cooperativeId },
        select: { name: true },
      });
      const memberName = `${updated.member.user.firstName} ${updated.member.user.lastName}`;
      
      sendEmail(
        updated.member.user.email,
        'Loan Request Declined - CoopManager',
        generateLoanRejectedEmailTemplate(
          memberName,
          cooperative?.name || 'Your Cooperative',
          loan.amount,
          dto.reason,
        ),
      ).catch(err => console.error('Failed to send loan rejection email:', err));
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

    // Calculate deductions
    const applicationFee = loan.loanType?.applicationFee || 0;
    const deductInterestUpfront = loan.loanType?.deductInterestUpfront || false;
    const interestDeductedUpfront = deductInterestUpfront ? loan.interestAmount : 0;
    const netDisbursementAmount = loan.amount - applicationFee - interestDeductedUpfront;

    if (netDisbursementAmount <= 0) {
      throw new BadRequestException('Net disbursement amount must be greater than zero after deductions');
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
          applicationFee,
          interestDeductedUpfront,
          netDisbursementAmount,
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

    // Add ledger entry for the net disbursement amount
    await this.prisma.ledgerEntry.create({
      data: {
        cooperativeId: loan.cooperativeId,
        memberId: loan.memberId,
        type: 'loan_disbursement',
        amount: -netDisbursementAmount, // Negative because money goes out to member
        balanceAfter: 0, // Will be calculated properly
        referenceId: loan.id,
        referenceType: 'loan',
        description: `Loan disbursement: ₦${netDisbursementAmount.toLocaleString()}${applicationFee > 0 ? ` (Application fee: ₦${applicationFee.toLocaleString()})` : ''}${interestDeductedUpfront > 0 ? ` (Upfront interest: ₦${interestDeductedUpfront.toLocaleString()})` : ''}`,
        createdBy: requestingUserId,
      },
    });

    await this.activitiesService.create({
      userId: requestingUserId,
      cooperativeId: loan.cooperativeId,
      action: 'loan_disbursed',
      description: `Disbursed loan of ₦${loan.amount.toLocaleString()} (Net: ₦${netDisbursementAmount.toLocaleString()})`,
    });

    // Build deduction message for notifications/emails
    const deductionParts: string[] = [];
    if (applicationFee > 0) {
      deductionParts.push(`application fee of ₦${applicationFee.toLocaleString()}`);
    }
    if (interestDeductedUpfront > 0) {
      deductionParts.push(`upfront interest of ₦${interestDeductedUpfront.toLocaleString()}`);
    }
    const deductionMessage = deductionParts.length > 0 
      ? ` After deducting ${deductionParts.join(' and ')}, you will receive ₦${netDisbursementAmount.toLocaleString()}.`
      : '';

    // Notify the member that their loan was disbursed
    if (updated.member.userId) {
      await this.notificationsService.createNotification({
        userId: updated.member.userId,
        cooperativeId: loan.cooperativeId,
        type: 'loan_disbursed',
        title: 'Loan Disbursed',
        body: `Your loan of ₦${loan.amount.toLocaleString()} has been disbursed.${deductionMessage} First repayment is due on ${schedules[0]?.dueDate.toLocaleDateString()}.`,
        data: { loanId: loan.id },
      });
    }

    // Send disbursement email to the member
    if (updated.member.user?.email) {
      const cooperative = await this.prisma.cooperative.findUnique({
        where: { id: loan.cooperativeId },
        select: { name: true },
      });
      const memberName = `${updated.member.user.firstName} ${updated.member.user.lastName}`;
      
      sendEmail(
        updated.member.user.email,
        'Loan Disbursed - CoopManager',
        generateLoanDisbursedEmailTemplate(
          memberName,
          cooperative?.name || 'Your Cooperative',
          loan.amount,
          schedules[0]?.dueDate.toLocaleDateString() || 'TBD',
          loan.monthlyRepayment,
          applicationFee,
          interestDeductedUpfront,
          netDisbursementAmount,
        ),
      ).catch(err => console.error('Failed to send loan disbursement email:', err));
    }

    // Refetch to include schedules
    return this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        member: { include: { user: true } },
        loanType: true,
        repaymentSchedules: { orderBy: { installmentNumber: 'asc' } },
        guarantors: {
          include: {
            guarantor: { include: { user: true } },
          },
        },
        kycDocuments: true,
        approvals: {
          include: {
            approver: true,
          },
        },
      },
    });
  }

  async recordRepayment(loanId: string, dto: RecordRepaymentDto, requestingUserId: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { 
        repaymentSchedules: { orderBy: { installmentNumber: 'asc' } },
        member: { include: { user: true } },
      },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    // Check if user is the loan owner (member) or has approval permission
    const member = await this.prisma.member.findFirst({
      where: {
        cooperativeId: loan.cooperativeId,
        userId: requestingUserId,
        status: 'active',
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    const isLoanOwner = loan.memberId === member.id;
    const permissions = parsePermissions(member.permissions);
    const hasApprovalPermission = hasPermission(member.role, permissions, PERMISSIONS.LOANS_APPROVE);

    if (!isLoanOwner && !hasApprovalPermission) {
      throw new ForbiddenException('You do not have permission to record repayments for this loan');
    }

    if (!['disbursed', 'repaying'].includes(loan.status)) {
      throw new BadRequestException('Loan is not in a repayable state');
    }

    // Check for duplicate repayment with same amount in the last 2 minutes (prevents double-clicks)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const recentLedgerEntry = await this.prisma.ledgerEntry.findFirst({
      where: {
        referenceId: loanId,
        referenceType: 'loan',
        type: 'loan_repayment',
        amount: dto.amount,
        createdAt: { gte: twoMinutesAgo },
      },
    });

    if (recentLedgerEntry) {
      throw new BadRequestException('A similar repayment was recorded recently. Please wait before recording another repayment.');
    }

    // If member is recording their own payment (not admin), create a pending repayment record
    // that requires admin confirmation instead of directly updating the ledger
    if (isLoanOwner && !hasApprovalPermission) {
      // Create pending repayment record
      const repayment = await this.prisma.loanRepayment.create({
        data: {
          loanId: loan.id,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod || 'bank_transfer',
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
          receiptNumber: dto.receiptNumber,
          notes: dto.notes,
          submittedBy: requestingUserId,
          status: 'pending',
        },
        include: {
          submitter: true,
          loan: {
            include: {
              member: { include: { user: true } },
            },
          },
        },
      });

      // Notify admins about pending repayment
      await this.notificationsService.notifyCooperativeAdmins(
        loan.cooperativeId,
        'loan_repayment_pending',
        'Loan Repayment Pending Review',
        `${loan.member.user?.firstName || 'A member'} ${loan.member.user?.lastName || ''} has submitted a loan repayment of ₦${dto.amount.toLocaleString()} for review.`,
        { loanId: loan.id, repaymentId: repayment.id, amount: dto.amount, memberId: loan.memberId },
        [requestingUserId], // Exclude the requester
      );

      // Notify the member that their payment is pending approval
      await this.notificationsService.createNotification({
        userId: requestingUserId,
        cooperativeId: loan.cooperativeId,
        type: 'loan_repayment_submitted',
        title: 'Repayment Submitted',
        body: `Your loan repayment of ₦${dto.amount.toLocaleString()} has been submitted and is pending admin confirmation.`,
        data: { loanId: loan.id, repaymentId: repayment.id, amount: dto.amount },
        actionType: 'navigate',
        actionRoute: 'LoanDetail',
        actionParams: { loanId: loan.id },
      });

      return {
        ...loan,
        repayment,
        message: 'Repayment submitted successfully. Pending admin confirmation.',
      };
    }

    // Admin is recording repayment - update ledger directly
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

    // Notify the member about the repayment
    if (updated.member.userId) {
      const message = newStatus === 'completed'
        ? `Your loan has been fully repaid! Thank you for completing your loan of ₦${loan.amount.toLocaleString()}.`
        : `Your loan repayment of ₦${dto.amount.toLocaleString()} has been recorded. Outstanding balance: ₦${Math.max(0, newOutstanding).toLocaleString()}.`;

      await this.notificationsService.createNotification({
        userId: updated.member.userId,
        cooperativeId: loan.cooperativeId,
        type: newStatus === 'completed' ? 'loan_completed' : 'loan_repayment_recorded',
        title: newStatus === 'completed' ? 'Loan Fully Repaid' : 'Loan Repayment Recorded',
        body: message,
        data: { loanId: loan.id, amountPaid: dto.amount, outstandingBalance: Math.max(0, newOutstanding) },
      });
    }

    return updated;
  }

  // ==================== LOAN QUERIES ====================

  async getLoans(cooperativeId: string, requestingUserId: string) {
    const member = await this.validateMembership(cooperativeId, requestingUserId);

    // Check if user has permission to view all loans
    const permissions = parsePermissions(member.permissions);
    const canViewAllLoans = hasPermission(member.role, permissions, PERMISSIONS.LOANS_VIEW);

    // If user has LOANS_VIEW permission, return all loans
    // Otherwise, return only their own loans
    const whereClause = canViewAllLoans 
      ? { cooperativeId }
      : { cooperativeId, memberId: member.id };

    const loans = await this.prisma.loan.findMany({
      where: whereClause,
      include: {
        member: { include: { user: true } },
        loanType: true,
      },
      orderBy: { requestedAt: 'desc' },
    });

    // Map to include calculated fields for frontend compatibility
    return loans.map(loan => ({
      ...loan,
      totalRepayable: loan.totalRepayment,
      amountPaid: loan.amountRepaid,
      amountRemaining: loan.outstandingBalance,
      monthlyPayment: loan.monthlyRepayment,
      nextPaymentDate: loan.deductionStartDate?.toISOString(),
      disbursedAmount: loan.amountDisbursed,
    }));
  }

  async getLoan(loanId: string, requestingUserId: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        member: { include: { user: true } },
        loanType: true,
        repaymentSchedules: { orderBy: { installmentNumber: 'asc' } },
        repayments: {
          where: { status: 'pending' },
          include: {
            submitter: true,
          },
          orderBy: { submittedAt: 'desc' },
        },
        guarantors: {
          include: {
            guarantor: { include: { user: true } },
          },
        },
        kycDocuments: true,
        approvals: {
          include: {
            approver: true,
          },
        },
      },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    await this.validateMembership(loan.cooperativeId, requestingUserId);

    // Return with mapped fields for frontend compatibility
    return {
      ...loan,
      totalRepayable: loan.totalRepayment,
      amountPaid: loan.amountRepaid,
      amountRemaining: loan.outstandingBalance,
      monthlyPayment: loan.monthlyRepayment,
      nextPaymentDate: loan.deductionStartDate?.toISOString(),
      disbursedAmount: loan.amountDisbursed,
    };
  }

  async getKycDocument(documentId: string, requestingUserId: string) {
    const document = await this.prisma.loanKycDocument.findUnique({
      where: { id: documentId },
      include: {
        loan: {
          include: {
            member: { include: { user: true } },
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Check if user has access to this document
    await this.validateMembership(document.loan.cooperativeId, requestingUserId);

    return document;
  }

  // ==================== REPAYMENT CONFIRMATION WORKFLOW ====================

  async getPendingRepayments(cooperativeId: string, requestingUserId: string) {
    await this.validatePermission(cooperativeId, requestingUserId, PERMISSIONS.LOANS_APPROVE);

    const repayments = await this.prisma.loanRepayment.findMany({
      where: {
        loan: {
          cooperativeId,
        },
        status: 'pending',
      },
      include: {
        loan: {
          include: {
            member: { include: { user: true } },
            loanType: true,
          },
        },
        submitter: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    return repayments;
  }

  async confirmRepayment(repaymentId: string, requestingUserId: string) {
    const repayment = await this.prisma.loanRepayment.findUnique({
      where: { id: repaymentId },
      include: {
        loan: {
          include: {
            member: { include: { user: true } },
            repaymentSchedules: { orderBy: { installmentNumber: 'asc' } },
          },
        },
        submitter: true,
      },
    });

    if (!repayment) {
      throw new NotFoundException('Repayment record not found');
    }

    if (repayment.status !== 'pending') {
      throw new BadRequestException('This repayment has already been reviewed');
    }

    await this.validatePermission(repayment.loan.cooperativeId, requestingUserId, PERMISSIONS.LOANS_APPROVE);

    // Update repayment status
    await this.prisma.loanRepayment.update({
      where: { id: repaymentId },
      data: {
        status: 'confirmed',
        reviewedBy: requestingUserId,
        reviewedAt: new Date(),
      },
    });

    // Now process the payment (same logic as admin recording)
    const loan = repayment.loan;
    let remainingAmount = repayment.amount;

    // Apply payment to schedules
    for (const schedule of loan.repaymentSchedules) {
      if (remainingAmount <= 0) break;
      if (schedule.status === 'paid') continue;

      const amountDue = schedule.totalAmount - schedule.paidAmount;
      const amountToPay = Math.min(remainingAmount, amountDue);

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
    const newAmountRepaid = loan.amountRepaid + repayment.amount;
    const newOutstanding = loan.totalRepayment - newAmountRepaid;
    const newStatus = newOutstanding <= 0 ? 'completed' : 'repaying';

    const updatedLoan = await this.prisma.loan.update({
      where: { id: loan.id },
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
        amount: repayment.amount,
        balanceAfter: 0,
        referenceId: loan.id,
        referenceType: 'loan',
        description: `Loan repayment confirmed: ₦${repayment.amount.toLocaleString()}`,
        createdBy: requestingUserId,
      },
    });

    await this.activitiesService.create({
      userId: requestingUserId,
      cooperativeId: loan.cooperativeId,
      action: 'loan_repayment_confirmed',
      description: `Confirmed loan repayment of ₦${repayment.amount.toLocaleString()}`,
    });

    // Notify the member about confirmation
    if (loan.member.userId) {
      const message = newStatus === 'completed'
        ? `Your loan repayment of ₦${repayment.amount.toLocaleString()} has been confirmed and your loan is now fully repaid! 🎉`
        : `Your loan repayment of ₦${repayment.amount.toLocaleString()} has been confirmed. Outstanding balance: ₦${Math.max(0, newOutstanding).toLocaleString()}.`;

      await this.notificationsService.createNotification({
        userId: loan.member.userId,
        cooperativeId: loan.cooperativeId,
        type: newStatus === 'completed' ? 'loan_completed' : 'loan_repayment_confirmed',
        title: newStatus === 'completed' ? 'Loan Fully Repaid! 🎉' : 'Repayment Confirmed',
        body: message,
        data: { loanId: loan.id, repaymentId, amountPaid: repayment.amount, outstandingBalance: Math.max(0, newOutstanding) },
        actionType: 'navigate',
        actionRoute: 'LoanDetail',
        actionParams: { loanId: loan.id },
      });
    }

    return updatedLoan;
  }

  async rejectRepayment(repaymentId: string, reason: string, requestingUserId: string) {
    const repayment = await this.prisma.loanRepayment.findUnique({
      where: { id: repaymentId },
      include: {
        loan: {
          include: {
            member: { include: { user: true } },
          },
        },
        submitter: true,
      },
    });

    if (!repayment) {
      throw new NotFoundException('Repayment record not found');
    }

    if (repayment.status !== 'pending') {
      throw new BadRequestException('This repayment has already been reviewed');
    }

    await this.validatePermission(repayment.loan.cooperativeId, requestingUserId, PERMISSIONS.LOANS_APPROVE);

    // Update repayment status
    await this.prisma.loanRepayment.update({
      where: { id: repaymentId },
      data: {
        status: 'rejected',
        reviewedBy: requestingUserId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    await this.activitiesService.create({
      userId: requestingUserId,
      cooperativeId: repayment.loan.cooperativeId,
      action: 'loan_repayment_rejected',
      description: `Rejected loan repayment of ₦${repayment.amount.toLocaleString()}`,
    });

    // Notify the member about rejection
    if (repayment.loan.member.userId) {
      await this.notificationsService.createNotification({
        userId: repayment.loan.member.userId,
        cooperativeId: repayment.loan.cooperativeId,
        type: 'loan_repayment_rejected',
        title: 'Repayment Rejected',
        body: `Your loan repayment of ₦${repayment.amount.toLocaleString()} has been rejected. Reason: ${reason}`,
        data: { loanId: repayment.loanId, repaymentId, amount: repayment.amount, reason },
        actionType: 'navigate',
        actionRoute: 'LoanDetail',
        actionParams: { loanId: repayment.loanId },
      });
    }

    return { success: true, message: 'Repayment rejected successfully' };
  }

  async getLoansAsGuarantor(cooperativeId: string, requestingUserId: string) {
    // Get user's member record
    const member = await this.prisma.member.findFirst({
      where: {
        cooperativeId,
        userId: requestingUserId,
        status: 'active',
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    // Get all loans where user is a guarantor
    const guarantorRecords = await this.prisma.loanGuarantor.findMany({
      where: {
        guarantorMemberId: member.id,
      },
      include: {
        loan: {
          include: {
            member: { include: { user: true } },
            loanType: true,
            guarantors: {
              include: {
                guarantor: { include: { user: true } },
              },
            },
            kycDocuments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return guarantorRecords.map(gr => ({
      ...gr.loan,
      guarantorStatus: gr.status,
      guarantorRespondedAt: gr.respondedAt,
      guarantorRejectionReason: gr.rejectionReason,
    }));
  }

  async respondToGuarantorRequest(
    loanId: string,
    approved: boolean,
    reason: string | undefined,
    requestingUserId: string,
  ) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        member: { include: { user: true } },
        loanType: true,
      },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    // Get guarantor's member record
    const guarantorMember = await this.prisma.member.findFirst({
      where: {
        cooperativeId: loan.cooperativeId,
        userId: requestingUserId,
        status: 'active',
      },
      include: { user: true },
    });

    if (!guarantorMember) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    // Find guarantor record
    const guarantorRecord = await this.prisma.loanGuarantor.findUnique({
      where: {
        loanId_guarantorMemberId: {
          loanId,
          guarantorMemberId: guarantorMember.id,
        },
      },
    });

    if (!guarantorRecord) {
      throw new NotFoundException('You are not a guarantor for this loan');
    }

    if (guarantorRecord.status !== 'pending') {
      throw new BadRequestException('You have already responded to this request');
    }

    // Update guarantor status
    await this.prisma.loanGuarantor.update({
      where: { id: guarantorRecord.id },
      data: {
        status: approved ? 'approved' : 'rejected',
        respondedAt: new Date(),
        rejectionReason: approved ? null : reason,
      },
    });

    // Log activity
    await this.activitiesService.log(
      requestingUserId,
      approved ? 'guarantor_approved' : 'guarantor_rejected',
      approved
        ? `Approved to guarantee loan of ₦${loan.amount.toLocaleString()}`
        : `Rejected to guarantee loan of ₦${loan.amount.toLocaleString()}`,
      loan.cooperativeId,
      { loanId: loan.id }
    );

    // Notify loan requester
    if (loan.member.userId && guarantorMember.user) {
      await this.notificationsService.createNotification({
        userId: loan.member.userId,
        cooperativeId: loan.cooperativeId,
        type: approved ? 'guarantor_approved' : 'guarantor_rejected',
        title: approved ? 'Guarantor Approved' : 'Guarantor Rejected',
        body: approved
          ? `${guarantorMember.user.firstName} ${guarantorMember.user.lastName} has approved to guarantee your loan`
          : `${guarantorMember.user.firstName} ${guarantorMember.user.lastName} has declined to guarantee your loan${reason ? `: ${reason}` : ''}`,
        data: {
          loanId: loan.id,
          guarantorName: `${guarantorMember.user.firstName} ${guarantorMember.user.lastName}`,
        },
        actionType: 'view',
        actionRoute: `/loans/${loan.id}`,
      });
    }

    // If all required guarantors have approved and loan is still pending, notify admins
    if (approved && loan.status === 'pending' && loan.loanType?.requiresGuarantor) {
      const allGuarantors = await this.prisma.loanGuarantor.findMany({
        where: { loanId },
      });

      const approvedCount = allGuarantors.filter(g => g.status === 'approved').length;
      const minRequired = loan.loanType.minGuarantors || 1;

      if (approvedCount >= minRequired) {
        // Notify admins that loan is ready for review
        const admins = await this.prisma.member.findMany({
          where: {
            cooperativeId: loan.cooperativeId,
            status: 'active',
          },
          include: { user: true },
        });

        for (const admin of admins) {
          const permissions = parsePermissions(admin.permissions);
          if (hasPermission(admin.role, permissions, PERMISSIONS.LOANS_APPROVE) && admin.userId && loan.member.user) {
            await this.notificationsService.createNotification({
              userId: admin.userId,
              cooperativeId: loan.cooperativeId,
              type: 'loan_ready_for_review',
              title: 'Loan Ready for Review',
              body: `${loan.member.user.firstName} ${loan.member.user.lastName}'s loan of ₦${loan.amount.toLocaleString()} has all required guarantor approvals`,
              data: {
                loanId: loan.id,
                amount: loan.amount,
              },
              actionType: 'view',
              actionRoute: `/loans/${loan.id}`,
            });
          }
        }
      }
    }

    return this.getLoan(loanId, requestingUserId);
  }

  async getPendingLoans(cooperativeId: string, requestingUserId: string) {
    await this.validatePermission(cooperativeId, requestingUserId, PERMISSIONS.LOANS_VIEW);

    const loans = await this.prisma.loan.findMany({
      where: { cooperativeId, status: 'pending' },
      include: {
        member: { include: { user: true } },
        loanType: true,
        guarantors: {
          include: {
            guarantor: { include: { user: true } },
          },
        },
        kycDocuments: true,
        approvals: {
          include: {
            approver: true,
          },
        },
      },
      orderBy: { requestedAt: 'asc' },
    });

    // Map to include calculated fields for frontend compatibility
    return loans.map(loan => ({
      ...loan,
      totalRepayable: loan.totalRepayment,
      amountPaid: loan.amountRepaid,
      amountRemaining: loan.outstandingBalance,
      monthlyPayment: loan.monthlyRepayment,
      nextPaymentDate: loan.deductionStartDate?.toISOString(),
      disbursedAmount: loan.amountDisbursed,
    }));
  }

  async getMyLoans(cooperativeId: string, requestingUserId: string) {
    const member = await this.validateMembership(cooperativeId, requestingUserId);

    const loans = await this.prisma.loan.findMany({
      where: { memberId: member.id },
      include: {
        loanType: true,
        repaymentSchedules: { orderBy: { installmentNumber: 'asc' } },
        guarantors: {
          include: {
            guarantor: { include: { user: true } },
          },
        },
        kycDocuments: true,
        approvals: {
          include: {
            approver: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    // Map to include calculated fields for frontend compatibility
    return loans.map(loan => ({
      ...loan,
      totalRepayable: loan.totalRepayment,
      amountPaid: loan.amountRepaid,
      amountRemaining: loan.outstandingBalance,
      monthlyPayment: loan.monthlyRepayment,
      nextPaymentDate: loan.deductionStartDate?.toISOString(),
      disbursedAmount: loan.amountDisbursed,
    }));
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

  private calculateLoanDetails(amount: number, interestRate: number, duration: number, interestType: string, deductInterestUpfront: boolean = false) {
    let interestAmount: number;
    let monthlyRepayment: number;
    let totalRepayment: number;

    if (interestType === 'reducing_balance') {
      // Reducing balance calculation (EMI formula)
      const monthlyRate = interestRate / 100 / 12;
      if (monthlyRate === 0) {
        // No interest case
        interestAmount = 0;
        monthlyRepayment = Math.ceil(amount / duration);
        totalRepayment = amount;
      } else {
        // EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
        const emi = Math.ceil(
          (amount * monthlyRate * Math.pow(1 + monthlyRate, duration)) /
            (Math.pow(1 + monthlyRate, duration) - 1)
        );
        monthlyRepayment = emi;
        totalRepayment = emi * duration;
        interestAmount = totalRepayment - amount;
      }
    } else {
      // Flat rate calculation: one-time percentage of principal
      interestAmount = Math.ceil(amount * interestRate / 100);
      totalRepayment = amount + interestAmount;
      monthlyRepayment = Math.ceil(totalRepayment / duration);
    }

    if (deductInterestUpfront) {
      // Upfront interest: member repays only principal
      // Interest is deducted from disbursement amount
      // Reset total and monthly repayment to principal only
      totalRepayment = amount;
      monthlyRepayment = Math.ceil(amount / duration);
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
