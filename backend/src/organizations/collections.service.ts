import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectionDto, AddTransactionDto, UpdateTransactionDto, ApproveCollectionDto, RejectCollectionDto } from './dto/collection.dto';
import { CollectionValidationService } from './validation/collection-validation.service';

@Injectable()
export class CollectionsService {
  private validationService: CollectionValidationService;

  constructor(private prisma: PrismaService) {
    this.validationService = new CollectionValidationService(prisma);
  }

  // Create a new daily collection (draft status)
  async create(organizationId: string, staffId: string, createDto: CreateCollectionDto) {
    // Validate collection date
    this.validationService.validateCollectionDate(new Date(createDto.collectionDate));

    // Verify staff belongs to organization
    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        organizationId,
        isActive: true,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found in this organization');
    }

    // Check if there's already a collection for this date and staff
    const existingCollection = await this.prisma.dailyCollection.findFirst({
      where: {
        staffId,
        collectionDate: new Date(createDto.collectionDate),
        status: { in: ['draft', 'submitted'] },
      },
    });

    if (existingCollection) {
      throw new BadRequestException('A collection already exists for this date');
    }

    const collection = await this.prisma.dailyCollection.create({
      data: {
        organizationId,
        staffId,
        collectionDate: new Date(createDto.collectionDate),
        status: 'draft',
      },
      include: {
        staff: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return collection;
  }

  // Get all collections with filters
  async findAll(organizationId: string, filters?: {
    staffId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    cooperativeId?: string;
  }) {
    const where: any = { organizationId };

    if (filters?.staffId) {
      where.staffId = filters.staffId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.collectionDate = {};
      if (filters.startDate) {
        where.collectionDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.collectionDate.lte = new Date(filters.endDate);
      }
    }

    const collections = await this.prisma.dailyCollection.findMany({
      where,
      include: {
        staff: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        transactions: {
          select: {
            id: true,
            cooperativeId: true,
            memberId: true,
            type: true,
            amount: true,
            status: true,
          },
        },
      },
      orderBy: {
        collectionDate: 'desc',
      },
    });

    return collections;
  }

  // Get single collection with full details
  async findOne(collectionId: string, organizationId: string) {
    const collection = await this.prisma.dailyCollection.findFirst({
      where: {
        id: collectionId,
        organizationId,
      },
      include: {
        staff: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        transactions: {
          include: {
            dailyCollection: false, // Avoid circular reference
          },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    return collection;
  }

  // Add transaction to collection
  async addTransaction(collectionId: string, organizationId: string, staffId: string, transactionDto: AddTransactionDto) {
    const collection = await this.prisma.dailyCollection.findFirst({
      where: {
        id: collectionId,
        organizationId,
        staffId,
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    // Validate collection is editable
    this.validationService.validateCollectionEditable(collection.status);

    // Validate transaction amount
    await this.validationService.validateTransactionAmount(
      transactionDto.amount,
      transactionDto.type,
      transactionDto.cooperativeId,
    );

    // Validate member eligibility
    await this.validationService.validateMemberEligibility(
      transactionDto.memberId,
      transactionDto.cooperativeId,
    );

    // Validate transaction type is available for cooperative
    await this.validationService.validateTransactionType(
      transactionDto.type,
      transactionDto.cooperativeId,
    );

    // Validate payment method
    this.validationService.validatePaymentMethod(
      transactionDto.paymentMethod,
      transactionDto.type,
    );

    // Check for duplicate transactions
    await this.validationService.checkDuplicateTransaction(
      collectionId,
      transactionDto.memberId,
      transactionDto.amount,
      transactionDto.type,
      collection.collectionDate,
    );

    // Special validation for loan repayments
    if (transactionDto.type === 'loan_repayment') {
      await this.validationService.validateLoanRepayment(
        transactionDto.memberId,
        transactionDto.cooperativeId,
        transactionDto.amount,
      );
    }

    // Verify member exists and belongs to the cooperative
    const member = await this.prisma.member.findFirst({
      where: {
        id: transactionDto.memberId,
        cooperativeId: transactionDto.cooperativeId,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this cooperative');
    }

    const transaction = await this.prisma.collectionTransaction.create({
      data: {
        dailyCollectionId: collectionId,
        cooperativeId: transactionDto.cooperativeId,
        memberId: transactionDto.memberId,
        type: transactionDto.type,
        amount: transactionDto.amount,
        paymentMethod: transactionDto.paymentMethod,
        reference: transactionDto.reference,
        notes: transactionDto.notes,
        metadata: transactionDto.metadata,
        status: 'pending',
      },
    });

    // Update collection totals
    await this.updateCollectionTotals(collectionId);

    return transaction;
  }

  // Update transaction
  async updateTransaction(transactionId: string, collectionId: string, staffId: string, updateDto: UpdateTransactionDto) {
    const transaction = await this.prisma.collectionTransaction.findFirst({
      where: {
        id: transactionId,
        dailyCollectionId: collectionId,
      },
      include: {
        dailyCollection: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.dailyCollection.staffId !== staffId) {
      throw new ForbiddenException('You can only update your own transactions');
    }

    if (transaction.dailyCollection.status !== 'draft') {
      throw new BadRequestException('Cannot update transactions in a submitted collection');
    }

    const updated = await this.prisma.collectionTransaction.update({
      where: { id: transactionId },
      data: updateDto,
    });

    // Update collection totals
    await this.updateCollectionTotals(collectionId);

    return updated;
  }

  // Delete transaction
  async deleteTransaction(transactionId: string, collectionId: string, staffId: string) {
    const transaction = await this.prisma.collectionTransaction.findFirst({
      where: {
        id: transactionId,
        dailyCollectionId: collectionId,
      },
      include: {
        dailyCollection: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.dailyCollection.staffId !== staffId) {
      throw new ForbiddenException('You can only delete your own transactions');
    }

    if (transaction.dailyCollection.status !== 'draft') {
      throw new BadRequestException('Cannot delete transactions from a submitted collection');
    }

    await this.prisma.collectionTransaction.delete({
      where: { id: transactionId },
    });

    // Update collection totals
    await this.updateCollectionTotals(collectionId);

    return { message: 'Transaction deleted successfully' };
  }

  // Submit collection for approval
  async submit(collectionId: string, organizationId: string, staffId: string) {
    const collection = await this.prisma.dailyCollection.findFirst({
      where: {
        id: collectionId,
        organizationId,
        staffId,
      },
      include: {
        transactions: true,
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    // Validate collection is editable
    this.validationService.validateCollectionEditable(collection.status);

    // Validate collection has transactions and they are valid
    await this.validationService.validateCollectionSubmission(collectionId);

    const updated = await this.prisma.dailyCollection.update({
      where: { id: collectionId },
      data: {
        status: 'submitted',
        submittedAt: new Date(),
      },
      include: {
        staff: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        transactions: true,
      },
    });

    return updated;
  }

  // Approve collection and post transactions
  async approve(collectionId: string, organizationId: string, approverId: string, approveDto: ApproveCollectionDto) {
    const collection = await this.prisma.dailyCollection.findFirst({
      where: {
        id: collectionId,
        organizationId,
      },
      include: {
        transactions: true,
        organization: {
          include: {
            collectionSettings: true,
          },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    // Validate collection can be approved
    this.validationService.validateCollectionApprovable(collection.status);

    // Verify approver has permission
    const approverStaff = await this.prisma.staff.findFirst({
      where: {
        userId: approverId,
        organizationId,
        isActive: true,
      },
    });

    if (!approverStaff) {
      throw new ForbiddenException('You are not authorized to approve collections');
    }

    // Check if approver has APPROVE_COLLECTIONS permission
    if (!approverStaff.permissions.includes('APPROVE_COLLECTIONS') && approverStaff.role !== 'admin') {
      throw new ForbiddenException('Insufficient permissions to approve collections');
    }

    // Start transaction to update collection and post transactions
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update collection status
      const updatedCollection = await tx.dailyCollection.update({
        where: { id: collectionId },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: approverId,
          approvalNotes: approveDto.approvalNotes,
        },
      });

      // Post transactions based on collection settings
      const settings = collection.organization.collectionSettings;
      if (settings?.requireApproval === false || settings?.autoPostAfterHours === 0) {
        await this.postTransactions(collectionId, tx);
      }

      return updatedCollection;
    });

    return updated;
  }

  // Reject collection
  async reject(collectionId: string, organizationId: string, reviewerId: string, rejectDto: RejectCollectionDto) {
    const collection = await this.prisma.dailyCollection.findFirst({
      where: {
        id: collectionId,
        organizationId,
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.status !== 'submitted') {
      throw new BadRequestException('Only submitted collections can be rejected');
    }

    // Verify reviewer has permission
    const reviewerStaff = await this.prisma.staff.findFirst({
      where: {
        userId: reviewerId,
        organizationId,
        isActive: true,
      },
    });

    if (!reviewerStaff) {
      throw new ForbiddenException('You are not authorized to reject collections');
    }

    if (!reviewerStaff.permissions.includes('APPROVE_COLLECTIONS') && reviewerStaff.role !== 'admin') {
      throw new ForbiddenException('Insufficient permissions to reject collections');
    }

    const updated = await this.prisma.dailyCollection.update({
      where: { id: collectionId },
      data: {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionReason: rejectDto.rejectionReason,
      },
      include: {
        staff: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return updated;
  }

  // Get pending approvals for supervisors
  async getPendingApprovals(organizationId: string, staffId?: string) {
    const where: any = {
      organizationId,
      status: 'submitted',
    };

    if (staffId) {
      where.staffId = staffId;
    }

    const collections = await this.prisma.dailyCollection.findMany({
      where,
      include: {
        staff: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        transactions: {
          select: {
            id: true,
            type: true,
            amount: true,
            status: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'asc',
      },
    });

    return collections;
  }

  // Get collection statistics for staff/organization
  async getStats(organizationId: string, staffId?: string, startDate?: string, endDate?: string) {
    const where: any = { organizationId };

    if (staffId) {
      where.staffId = staffId;
    }

    if (startDate || endDate) {
      where.collectionDate = {};
      if (startDate) {
        where.collectionDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.collectionDate.lte = new Date(endDate);
      }
    }

    const [totalCollections, approvedCollections, pendingCollections, rejectedCollections, totalAmount] = await Promise.all([
      this.prisma.dailyCollection.count({ where }),
      this.prisma.dailyCollection.count({ where: { ...where, status: 'approved' } }),
      this.prisma.dailyCollection.count({ where: { ...where, status: 'submitted' } }),
      this.prisma.dailyCollection.count({ where: { ...where, status: 'rejected' } }),
      this.prisma.dailyCollection.aggregate({
        where: { ...where, status: 'approved' },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      totalCollections,
      approvedCollections,
      pendingCollections,
      rejectedCollections,
      draftCollections: totalCollections - approvedCollections - pendingCollections - rejectedCollections,
      totalAmountCollected: totalAmount._sum.totalAmount || 0,
    };
  }

  // Helper: Update collection totals
  private async updateCollectionTotals(collectionId: string) {
    const transactions = await this.prisma.collectionTransaction.findMany({
      where: { dailyCollectionId: collectionId },
      select: { amount: true },
    });

    const totalAmount = transactions.reduce((sum: number, tx: { amount: number }) => sum + tx.amount, 0);
    const transactionCount = transactions.length;

    await this.prisma.dailyCollection.update({
      where: { id: collectionId },
      data: {
        totalAmount,
        transactionCount,
      },
    });
  }

  // Helper: Post transactions to member ledgers (called after approval)
  // Made public to allow auto-post scheduler to call it
  async postTransactions(collectionId: string, tx: any) {
    const transactions = await tx.collectionTransaction.findMany({
      where: {
        dailyCollectionId: collectionId,
        status: 'pending',
      },
    });

    for (const transaction of transactions) {
      try {
        // Post based on transaction type
        switch (transaction.type) {
          case 'contribution':
            await this.postContribution(transaction, tx);
            break;
          case 'loan_repayment':
            await this.postLoanRepayment(transaction, tx);
            break;
          case 'ajo_payment':
            await this.postAjoPayment(transaction, tx);
            break;
          case 'esusu_contribution':
            await this.postEsusuContribution(transaction, tx);
            break;
          case 'share_purchase':
            await this.postSharePurchase(transaction, tx);
            break;
        }

        // Update transaction status to posted
        await tx.collectionTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'posted',
            postedAt: new Date(),
          },
        });
      } catch (error: any) {
        // Mark transaction as failed with error message
        await tx.collectionTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'failed',
            errorMessage: error.message,
          },
        });
      }
    }
  }

  // Post contribution payment
  private async postContribution(transaction: any, tx: any) {
    const metadata = transaction.metadata as any;
    if (!metadata?.planId) {
      throw new Error('Missing planId in transaction metadata');
    }

    const payment = await tx.contributionPayment.create({
      data: {
        memberId: transaction.memberId,
        cooperativeId: transaction.cooperativeId,
        planId: metadata.planId,
        amount: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        reference: transaction.reference,
        notes: transaction.notes,
      },
    });

    // Link payment to transaction
    await tx.collectionTransaction.update({
      where: { id: transaction.id },
      data: { contributionPaymentId: payment.id },
    });
  }

  // Post loan repayment
  private async postLoanRepayment(transaction: any, tx: any) {
    const metadata = transaction.metadata as any;
    if (!metadata?.loanId) {
      throw new Error('Missing loanId in transaction metadata');
    }

    const repayment = await tx.loanRepayment.create({
      data: {
        loanId: metadata.loanId,
        amount: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        reference: transaction.reference,
        notes: transaction.notes,
        submittedBy: transaction.dailyCollection?.staffId,
      },
    });

    await tx.collectionTransaction.update({
      where: { id: transaction.id },
      data: { loanRepaymentId: repayment.id },
    });
  }

  // Post AJO payment
  private async postAjoPayment(transaction: any, tx: any) {
    const metadata = transaction.metadata as any;
    if (!metadata?.ajoId) {
      throw new Error('Missing ajoId in transaction metadata');
    }

    const payment = await tx.ajoPayment.create({
      data: {
        memberId: transaction.memberId,
        ajoId: metadata.ajoId,
        amount: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        reference: transaction.reference,
        notes: transaction.notes,
      },
    });

    await tx.collectionTransaction.update({
      where: { id: transaction.id },
      data: { ajoPaymentId: payment.id },
    });
  }

  // Post Esusu contribution
  private async postEsusuContribution(transaction: any, tx: any) {
    const metadata = transaction.metadata as any;
    if (!metadata?.esusuId) {
      throw new Error('Missing esusuId in transaction metadata');
    }

    const contribution = await tx.esusuContribution.create({
      data: {
        memberId: transaction.memberId,
        esusuId: metadata.esusuId,
        amount: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        reference: transaction.reference,
        notes: transaction.notes,
      },
    });

    await tx.collectionTransaction.update({
      where: { id: transaction.id },
      data: { esusuContributionId: contribution.id },
    });
  }

  // Post share purchase
  private async postSharePurchase(transaction: any, tx: any) {
    // Update member's virtual balance
    await tx.member.update({
      where: { id: transaction.memberId },
      data: {
        virtualBalance: {
          increment: transaction.amount,
        },
      },
    });

    // Create activity record
    await tx.activity.create({
      data: {
        cooperativeId: transaction.cooperativeId,
        userId: transaction.dailyCollection?.staff?.userId,
        type: 'share_purchase',
        content: `Share purchase: ${transaction.amount} for member`,
      },
    });
  }

  // Public helper to get staff by user ID (for controllers)
  async getStaffByUserId(userId: string, organizationId: string) {
    return this.prisma.staff.findFirst({
      where: {
        userId,
        organizationId,
        isActive: true,
      },
    });
  }
}
