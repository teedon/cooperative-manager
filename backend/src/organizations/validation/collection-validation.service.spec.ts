import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CollectionValidationService } from '../validation/collection-validation.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CollectionValidationService', () => {
  let service: CollectionValidationService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    member: {
      findUnique: jest.fn(),
    },
    collectionTransaction: {
      findFirst: jest.fn(),
    },
    dailyCollection: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    ajoSettings: {
      findUnique: jest.fn(),
    },
    esusuSettings: {
      findUnique: jest.fn(),
    },
    loan: {
      findMany: jest.fn(),
    },
    loanRepayment: {
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionValidationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CollectionValidationService>(
      CollectionValidationService,
    );
    prismaService = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('validateTransactionAmount', () => {
    it('should reject amount below minimum (₦1.00)', async () => {
      await expect(
        service.validateTransactionAmount(50, 'contribution', 'coop1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.validateTransactionAmount(50, 'contribution', 'coop1'),
      ).rejects.toThrow('Transaction amount must be at least ₦1.00');
    });

    it('should reject zero or negative amounts', async () => {
      await expect(
        service.validateTransactionAmount(0, 'contribution', 'coop1'),
      ).rejects.toThrow('Transaction amount must be at least ₦1.00');

      await expect(
        service.validateTransactionAmount(-100, 'contribution', 'coop1'),
      ).rejects.toThrow('Transaction amount must be at least ₦1.00');
    });

    it('should reject contribution above ₦100,000', async () => {
      await expect(
        service.validateTransactionAmount(10000001, 'contribution', 'coop1'),
      ).rejects.toThrow(
        'Transaction amount cannot exceed ₦100,000 for contribution',
      );
    });

    it('should reject loan_repayment above ₦500,000', async () => {
      await expect(
        service.validateTransactionAmount(50000001, 'loan_repayment', 'coop1'),
      ).rejects.toThrow(
        'Transaction amount cannot exceed ₦500,000 for loan_repayment',
      );
    });

    it('should reject ajo_payment above ₦50,000', async () => {
      await expect(
        service.validateTransactionAmount(5000001, 'ajo_payment', 'coop1'),
      ).rejects.toThrow(
        'Transaction amount cannot exceed ₦50,000 for ajo_payment',
      );
    });

    it('should accept valid amounts', async () => {
      await expect(
        service.validateTransactionAmount(500000, 'contribution', 'coop1'),
      ).resolves.not.toThrow();

      await expect(
        service.validateTransactionAmount(100, 'contribution', 'coop1'),
      ).resolves.not.toThrow();
    });
  });

  describe('validateCollectionDate', () => {
    it('should reject future dates', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      await expect(
        service.validateCollectionDate(futureDate),
      ).rejects.toThrow('Collection date cannot be in the future');
    });

    it('should reject dates more than 30 days in past', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);

      await expect(service.validateCollectionDate(oldDate)).rejects.toThrow(
        'Collection date cannot be more than 30 days in the past',
      );
    });

    it('should accept today', async () => {
      await expect(
        service.validateCollectionDate(new Date()),
      ).resolves.not.toThrow();
    });

    it('should accept dates within 30 days', async () => {
      const validDate = new Date();
      validDate.setDate(validDate.getDate() - 15);

      await expect(
        service.validateCollectionDate(validDate),
      ).resolves.not.toThrow();
    });
  });

  describe('validateMemberEligibility', () => {
    it('should reject non-existent member', async () => {
      mockPrismaService.member.findUnique.mockResolvedValue(null);

      await expect(
        service.validateMemberEligibility('member1', 'coop1'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.validateMemberEligibility('member1', 'coop1'),
      ).rejects.toThrow('Member not found');
    });

    it('should reject member from wrong cooperative', async () => {
      mockPrismaService.member.findUnique.mockResolvedValue({
        id: 'member1',
        cooperativeId: 'coop2',
        status: 'active',
      });

      await expect(
        service.validateMemberEligibility('member1', 'coop1'),
      ).rejects.toThrow('Member not found in the specified cooperative');
    });

    it('should reject inactive member', async () => {
      mockPrismaService.member.findUnique.mockResolvedValue({
        id: 'member1',
        cooperativeId: 'coop1',
        status: 'suspended',
        user: { firstName: 'John', lastName: 'Doe' },
      });

      await expect(
        service.validateMemberEligibility('member1', 'coop1'),
      ).rejects.toThrow('Member John Doe is not active');
    });

    it('should accept active member', async () => {
      mockPrismaService.member.findUnique.mockResolvedValue({
        id: 'member1',
        cooperativeId: 'coop1',
        status: 'active',
      });

      await expect(
        service.validateMemberEligibility('member1', 'coop1'),
      ).resolves.not.toThrow();
    });
  });

  describe('checkDuplicateTransaction', () => {
    const collectionDate = new Date('2026-01-15');

    it('should detect duplicate within same collection', async () => {
      mockPrismaService.collectionTransaction.findFirst.mockResolvedValue({
        id: 'trans1',
        memberId: 'member1',
        amount: 500000,
        type: 'contribution',
      });

      await expect(
        service.checkDuplicateTransaction(
          'coll1',
          'member1',
          500000,
          'contribution',
          collectionDate,
        ),
      ).rejects.toThrow(
        'A similar transaction already exists for this member in this collection',
      );
    });

    it('should detect duplicate on same date', async () => {
      mockPrismaService.collectionTransaction.findFirst
        .mockResolvedValueOnce(null) // No duplicate in same collection
        .mockResolvedValueOnce({
          // Duplicate on same date
          id: 'trans2',
          memberId: 'member1',
          amount: 500000,
          type: 'contribution',
        });

      await expect(
        service.checkDuplicateTransaction(
          'coll1',
          'member1',
          500000,
          'contribution',
          collectionDate,
        ),
      ).rejects.toThrow(
        'A transaction with the same details already exists for this member today',
      );
    });

    it('should allow non-duplicate transactions', async () => {
      mockPrismaService.collectionTransaction.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        service.checkDuplicateTransaction(
          'coll1',
          'member1',
          500000,
          'contribution',
          collectionDate,
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('validateTransactionType', () => {
    it('should reject ajo_payment without AjoSettings', async () => {
      mockPrismaService.ajoSettings.findUnique.mockResolvedValue(null);

      await expect(
        service.validateTransactionType('ajo_payment', 'coop1'),
      ).rejects.toThrow('AJO feature is not enabled for this cooperative');
    });

    it('should reject esusu_contribution without EsusuSettings', async () => {
      mockPrismaService.esusuSettings.findUnique.mockResolvedValue(null);

      await expect(
        service.validateTransactionType('esusu_contribution', 'coop1'),
      ).rejects.toThrow('Esusu feature is not enabled for this cooperative');
    });

    it('should allow core transaction types', async () => {
      await expect(
        service.validateTransactionType('contribution', 'coop1'),
      ).resolves.not.toThrow();

      await expect(
        service.validateTransactionType('loan_repayment', 'coop1'),
      ).resolves.not.toThrow();

      await expect(
        service.validateTransactionType('share_purchase', 'coop1'),
      ).resolves.not.toThrow();
    });

    it('should allow ajo_payment with settings', async () => {
      mockPrismaService.ajoSettings.findUnique.mockResolvedValue({
        id: 'ajo1',
        cooperativeId: 'coop1',
      });

      await expect(
        service.validateTransactionType('ajo_payment', 'coop1'),
      ).resolves.not.toThrow();
    });
  });

  describe('validateLoanRepayment', () => {
    it('should reject when member has no active loans', async () => {
      mockPrismaService.loan.findMany.mockResolvedValue([]);

      await expect(
        service.validateLoanRepayment('member1', 'coop1', 500000),
      ).rejects.toThrow('Member does not have any active loans');
    });

    it('should reject when repayment exceeds outstanding balance', async () => {
      mockPrismaService.loan.findMany.mockResolvedValue([
        {
          id: 'loan1',
          principalAmount: 1000000,
          interestAmount: 100000,
          totalAmount: 1100000,
        },
      ]);

      mockPrismaService.loanRepayment.aggregate.mockResolvedValue({
        _sum: { amount: 800000 },
      });

      // Outstanding = 1,100,000 - 800,000 = 300,000
      // Attempting to pay 500,000
      await expect(
        service.validateLoanRepayment('member1', 'coop1', 500000),
      ).rejects.toThrow(
        'Repayment amount (₦5,000) exceeds outstanding balance (₦3,000)',
      );
    });

    it('should allow valid loan repayment', async () => {
      mockPrismaService.loan.findMany.mockResolvedValue([
        {
          id: 'loan1',
          principalAmount: 1000000,
          interestAmount: 100000,
          totalAmount: 1100000,
        },
      ]);

      mockPrismaService.loanRepayment.aggregate.mockResolvedValue({
        _sum: { amount: 800000 },
      });

      // Outstanding = 300,000, paying 200,000 (valid)
      await expect(
        service.validateLoanRepayment('member1', 'coop1', 200000),
      ).resolves.not.toThrow();
    });
  });

  describe('validateCollectionSubmission', () => {
    it('should reject collection with no transactions', async () => {
      mockPrismaService.dailyCollection.findFirst.mockResolvedValue({
        id: 'coll1',
        transactions: [],
      });

      await expect(
        service.validateCollectionSubmission('coll1'),
      ).rejects.toThrow(
        'Cannot submit an empty collection. Please add at least one transaction.',
      );
    });

    it('should reject collection with invalid transactions', async () => {
      mockPrismaService.dailyCollection.findFirst.mockResolvedValue({
        id: 'coll1',
        transactions: [
          { id: 'trans1', memberId: 'member1', amount: 100 },
          { id: 'trans2', memberId: null, amount: 200 }, // Invalid
          { id: 'trans3', memberId: 'member2', amount: 0 }, // Invalid
        ],
      });

      await expect(
        service.validateCollectionSubmission('coll1'),
      ).rejects.toThrow('Collection contains 2 invalid transaction(s)');
    });

    it('should allow valid collection', async () => {
      mockPrismaService.dailyCollection.findFirst.mockResolvedValue({
        id: 'coll1',
        transactions: [
          { id: 'trans1', memberId: 'member1', amount: 100 },
          { id: 'trans2', memberId: 'member2', amount: 200 },
        ],
      });

      await expect(
        service.validateCollectionSubmission('coll1'),
      ).resolves.not.toThrow();
    });
  });

  describe('validateCollectionEditable', () => {
    it('should reject non-draft status', async () => {
      await expect(
        service.validateCollectionEditable('submitted'),
      ).rejects.toThrow(
        'Cannot edit collection with status: submitted. Only draft collections can be edited.',
      );

      await expect(
        service.validateCollectionEditable('approved'),
      ).rejects.toThrow('Only draft collections can be edited');
    });

    it('should allow draft status', async () => {
      await expect(
        service.validateCollectionEditable('draft'),
      ).resolves.not.toThrow();
    });
  });

  describe('validateCollectionApprovable', () => {
    it('should reject non-submitted status', async () => {
      await expect(
        service.validateCollectionApprovable('draft'),
      ).rejects.toThrow('Only submitted collections can be approved');

      await expect(
        service.validateCollectionApprovable('approved'),
      ).rejects.toThrow('Only submitted collections can be approved');
    });

    it('should allow submitted status', async () => {
      await expect(
        service.validateCollectionApprovable('submitted'),
      ).resolves.not.toThrow();
    });
  });

  describe('validatePaymentMethod', () => {
    const validMethods = [
      'cash',
      'bank_transfer',
      'mobile_money',
      'card',
      'check',
    ];

    validMethods.forEach((method) => {
      it(`should allow ${method}`, async () => {
        await expect(
          service.validatePaymentMethod(method, 'contribution'),
        ).resolves.not.toThrow();
      });
    });

    it('should reject invalid payment method', async () => {
      await expect(
        service.validatePaymentMethod('crypto', 'contribution'),
      ).rejects.toThrow('Invalid payment method');
    });
  });
});
