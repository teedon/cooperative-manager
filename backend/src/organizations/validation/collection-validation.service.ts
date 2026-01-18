// Business validation utilities for Daily Collection System
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export class CollectionValidationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validate transaction amount
   * - Must be positive
   * - Must not exceed maximum limit
   * - Must meet minimum threshold
   */
  async validateTransactionAmount(
    amount: number,
    type: string,
    cooperativeId: string,
  ): Promise<void> {
    // Check minimum amount (100 = ₦1.00)
    const MIN_AMOUNT = 100;
    if (amount < MIN_AMOUNT) {
      throw new BadRequestException(
        `Transaction amount must be at least ₦${MIN_AMOUNT / 100}`,
      );
    }

    // Check maximum amount based on transaction type
    const MAX_AMOUNTS: Record<string, number> = {
      contribution: 10000000, // ₦100,000
      loan_repayment: 50000000, // ₦500,000
      ajo_payment: 5000000, // ₦50,000
      esusu_contribution: 5000000, // ₦50,000
      share_purchase: 10000000, // ₦100,000
    };

    const maxAmount = MAX_AMOUNTS[type] || 10000000;
    if (amount > maxAmount) {
      throw new BadRequestException(
        `Transaction amount cannot exceed ₦${maxAmount / 100} for ${type}`,
      );
    }

    // Additional cooperative-specific limits can be checked here
    // const cooperative = await this.prisma.cooperative.findUnique({
    //   where: { id: cooperativeId },
    //   select: { maxTransactionAmount: true }
    // });
    // if (cooperative?.maxTransactionAmount && amount > cooperative.maxTransactionAmount) {
    //   throw new BadRequestException('Amount exceeds cooperative limit');
    // }
  }

  /**
   * Validate collection date
   * - Cannot be in the future
   * - Cannot be more than 30 days in the past
   */
  validateCollectionDate(collectionDate: Date): void {
    const now = new Date();
    const date = new Date(collectionDate);

    // Remove time component for date-only comparison
    date.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    // Cannot be future date
    if (date > now) {
      throw new BadRequestException('Collection date cannot be in the future');
    }

    // Cannot be more than 30 days old
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (date < thirtyDaysAgo) {
      throw new BadRequestException(
        'Collection date cannot be more than 30 days in the past',
      );
    }
  }

  /**
   * Validate member eligibility
   * - Member must exist
   * - Member must be active
   * - Member must belong to the specified cooperative
   */
  async validateMemberEligibility(
    memberId: string,
    cooperativeId: string,
  ): Promise<void> {
    const member = await this.prisma.member.findFirst({
      where: {
        id: memberId,
        cooperativeId,
      },
      select: {
        id: true,
        status: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException(
        'Member not found in the specified cooperative',
      );
    }

    if (member.status !== 'active') {
      throw new BadRequestException(
        `Member ${member.user?.firstName} ${member.user?.lastName} is not active (status: ${member.status})`,
      );
    }
  }

  /**
   * Check for duplicate transactions
   * - Same member, amount, and transaction type on the same day
   */
  async checkDuplicateTransaction(
    collectionId: string,
    memberId: string,
    amount: number,
    type: string,
    collectionDate: Date,
  ): Promise<void> {
    const existingTransaction = await this.prisma.collectionTransaction.findFirst({
      where: {
        dailyCollectionId: collectionId,
        memberId,
        amount,
        type,
      },
    });

    if (existingTransaction) {
      throw new BadRequestException(
        'A similar transaction already exists for this member in this collection',
      );
    }

    // Check for duplicate across all collections on the same date
    const duplicateAcrossCollections = await this.prisma.collectionTransaction.count({
      where: {
        memberId,
        amount,
        type,
        dailyCollection: {
          collectionDate: {
            gte: new Date(collectionDate.setHours(0, 0, 0, 0)),
            lt: new Date(collectionDate.setHours(23, 59, 59, 999)),
          },
        },
      },
    });

    if (duplicateAcrossCollections > 0) {
      throw new BadRequestException(
        'A transaction with the same details already exists for this member today',
      );
    }
  }

  /**
   * Validate transaction type eligibility
   * - Check if cooperative has the feature enabled
   */
  async validateTransactionType(
    type: string,
    cooperativeId: string,
  ): Promise<void> {
    const cooperative = await this.prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!cooperative) {
      throw new NotFoundException('Cooperative not found');
    }

    // Transaction type specific validations
    switch (type) {
      case 'ajo_payment':
        // Check if cooperative has AJO feature
        const ajoSettings = await this.prisma.ajoSettings.findFirst({
          where: { cooperativeId },
        });
        if (!ajoSettings) {
          throw new BadRequestException(
            'AJO feature is not enabled for this cooperative',
          );
        }
        break;

      case 'esusu_contribution':
        // Check if cooperative has Esusu feature
        const esusuSettings = await this.prisma.esusuSettings.findFirst({
          where: { cooperativeId },
        });
        if (!esusuSettings) {
          throw new BadRequestException(
            'Esusu feature is not enabled for this cooperative',
          );
        }
        break;

      case 'loan_repayment':
        // Loan repayments are generally available
        break;

      case 'contribution':
      case 'share_purchase':
        // These are core features, always available
        break;

      default:
        throw new BadRequestException(`Invalid transaction type: ${type}`);
    }
  }

  /**
   * Validate loan repayment amount
   * - Check member has an active loan
   * - Amount should not exceed outstanding balance
   */
  async validateLoanRepayment(
    memberId: string,
    cooperativeId: string,
    amount: number,
  ): Promise<void> {
    // Find member's active loans
    const loans = await this.prisma.loan.findMany({
      where: {
        memberId,
        status: { in: ['approved', 'disbursed'] },
      },
      select: {
        id: true,
        principalAmount: true,
        interestAmount: true,
        amountRepaid: true,
        status: true,
      },
    });

    if (loans.length === 0) {
      throw new BadRequestException(
        'Member does not have any active loans',
      );
    }

    // Calculate total outstanding
    let totalOutstanding = 0;
    loans.forEach((loan) => {
      const totalDue = loan.principalAmount + loan.interestAmount;
      const outstanding = totalDue - loan.amountRepaid;
      totalOutstanding += outstanding;
    });

    if (amount > totalOutstanding) {
      throw new BadRequestException(
        `Repayment amount (₦${amount / 100}) exceeds outstanding balance (₦${totalOutstanding / 100})`,
      );
    }
  }

  /**
   * Validate collection submission
   * - Must have at least one transaction
   * - All transactions must be valid
   */
  async validateCollectionSubmission(collectionId: string): Promise<void> {
    const collection = await this.prisma.dailyCollection.findUnique({
      where: { id: collectionId },
      include: {
        transactions: true,
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.transactions.length === 0) {
      throw new BadRequestException(
        'Cannot submit an empty collection. Please add at least one transaction.',
      );
    }

    // Verify all transactions are valid
    const invalidTransactions = collection.transactions.filter(
      (t) => !t.memberId || !t.cooperativeId || t.amount <= 0,
    );

    if (invalidTransactions.length > 0) {
      throw new BadRequestException(
        `Collection contains ${invalidTransactions.length} invalid transaction(s)`,
      );
    }
  }

  /**
   * Check if collection can be edited
   * - Only draft collections can be edited
   */
  validateCollectionEditable(status: string): void {
    if (status !== 'draft') {
      throw new BadRequestException(
        `Cannot edit collection with status: ${status}. Only draft collections can be edited.`,
      );
    }
  }

  /**
   * Check if collection can be approved
   * - Only submitted collections can be approved
   * - Must not already be approved or rejected
   */
  validateCollectionApprovable(status: string): void {
    if (status !== 'submitted') {
      throw new BadRequestException(
        `Cannot approve collection with status: ${status}. Only submitted collections can be approved.`,
      );
    }
  }

  /**
   * Check if auto-posting is due
   * - Based on organization settings
   */
  async shouldAutoPost(collectionId: string): Promise<boolean> {
    const collection = await this.prisma.dailyCollection.findUnique({
      where: { id: collectionId },
      select: {
        status: true,
        submittedAt: true,
        organizationId: true,
      },
    });

    if (!collection || collection.status !== 'submitted' || !collection.submittedAt) {
      return false;
    }

    const settings = await this.prisma.collectionSettings.findUnique({
      where: { organizationId: collection.organizationId },
    });

    if (!settings || !settings.autoPostAfterHours) {
      return false;
    }

    const hoursSinceSubmission =
      (Date.now() - collection.submittedAt.getTime()) / (1000 * 60 * 60);

    return hoursSinceSubmission >= settings.autoPostAfterHours;
  }

  /**
   * Validate payment method is valid for transaction type
   */
  validatePaymentMethod(
    paymentMethod: string,
    type: string,
  ): void {
    const validMethods = ['cash', 'bank_transfer', 'mobile_money', 'card', 'check'];

    if (!validMethods.includes(paymentMethod)) {
      throw new BadRequestException(`Invalid payment method: ${paymentMethod}`);
    }

    // Certain transaction types may have restrictions
    // For example, share purchases might require bank transfers
    // This is cooperative-specific and can be enhanced
  }

  /**
   * Calculate total collection amount and transaction count
   */
  async calculateCollectionTotals(collectionId: string): Promise<{
    totalAmount: number;
    transactionCount: number;
  }> {
    const result = await this.prisma.collectionTransaction.aggregate({
      where: {
        dailyCollectionId: collectionId,
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      totalAmount: result._sum.amount || 0,
      transactionCount: result._count.id,
    };
  }
}
