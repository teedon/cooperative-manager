import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { OrganizationsModule } from '../src/organizations/organizations.module';

describe('Collections Integration Tests (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  // Test data
  let authToken: string;
  let organizationId: string;
  let staffId: string;
  let cooperativeId: string;
  let memberId: string;
  let collectionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OrganizationsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await app.close();
  });

  /**
   * Setup test organization, staff, cooperative, and member
   */
  async function setupTestData() {
    // Create test user
    const user = await prismaService.user.create({
      data: {
        email: 'test-collections@example.com',
        password: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '1234567890',
      },
    });

    // Create organization
    const organization = await prismaService.organization.create({
      data: {
        name: 'Test Organization',
        type: 'cooperative',
        userId: user.id,
      },
    });
    organizationId = organization.id;

    // Create cooperative
    const cooperative = await prismaService.cooperative.create({
      data: {
        name: 'Test Cooperative',
        code: 'TEST001',
        status: 'active',
      },
    });
    cooperativeId = cooperative.id;

    // Create staff
    const staff = await prismaService.staff.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        role: 'agent',
        permissions: ['MANAGE_COLLECTIONS'],
        isActive: true,
      },
    });
    staffId = staff.id;

    // Create test member
    const member = await prismaService.member.create({
      data: {
        cooperativeId: cooperative.id,
        userId: user.id,
        firstName: 'John',
        lastName: 'Doe',
        role: 'member',
        status: 'active',
        joinedAt: new Date(),
      },
    });
    memberId = member.id;

    // Mock auth token (in real tests, get from auth endpoint)
    authToken = 'mock-jwt-token';
  }

  /**
   * Cleanup all test data
   */
  async function cleanupTestData() {
    await prismaService.collectionTransaction.deleteMany({});
    await prismaService.dailyCollection.deleteMany({});
    await prismaService.member.deleteMany({});
    await prismaService.staff.deleteMany({});
    await prismaService.cooperative.deleteMany({});
    await prismaService.organization.deleteMany({});
    await prismaService.user.deleteMany({
      where: { email: 'test-collections@example.com' },
    });
  }

  describe('Complete Collection Workflow', () => {
    it('should create a new collection (draft)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/collections`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collectionDate: new Date().toISOString(),
          notes: 'Test collection',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('draft');
      expect(response.body.totalAmount).toBe(0);
      expect(response.body.transactionCount).toBe(0);

      collectionId = response.body.id;
    });

    it('should add transaction to collection', async () => {
      const response = await request(app.getHttpServer())
        .post(
          `/organizations/${organizationId}/collections/${collectionId}/transactions`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cooperativeId,
          memberId,
          type: 'contribution',
          amount: 500000, // ₦5,000
          paymentMethod: 'cash',
          notes: 'Monthly contribution',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.amount).toBe(500000);
      expect(response.body.type).toBe('contribution');
    });

    it('should reject duplicate transaction', async () => {
      await request(app.getHttpServer())
        .post(
          `/organizations/${organizationId}/collections/${collectionId}/transactions`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cooperativeId,
          memberId,
          type: 'contribution',
          amount: 500000, // Same amount
          paymentMethod: 'cash',
        })
        .expect(400);
    });

    it('should reject amount below minimum', async () => {
      await request(app.getHttpServer())
        .post(
          `/organizations/${organizationId}/collections/${collectionId}/transactions`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cooperativeId,
          memberId,
          type: 'contribution',
          amount: 50, // Below ₦1.00 minimum
          paymentMethod: 'cash',
        })
        .expect(400);
    });

    it('should reject amount above maximum', async () => {
      await request(app.getHttpServer())
        .post(
          `/organizations/${organizationId}/collections/${collectionId}/transactions`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cooperativeId,
          memberId,
          type: 'contribution',
          amount: 10000001, // Above ₦100,000 max
          paymentMethod: 'cash',
        })
        .expect(400);
    });

    it('should retrieve collection with transactions', async () => {
      const response = await request(app.getHttpServer())
        .get(`/organizations/${organizationId}/collections/${collectionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(collectionId);
      expect(response.body.transactions).toHaveLength(1);
      expect(response.body.totalAmount).toBe(500000);
      expect(response.body.transactionCount).toBe(1);
    });

    it('should submit collection for approval', async () => {
      const response = await request(app.getHttpServer())
        .patch(
          `/organizations/${organizationId}/collections/${collectionId}/submit`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('submitted');
      expect(response.body.submittedAt).toBeTruthy();
    });

    it('should reject editing submitted collection', async () => {
      await request(app.getHttpServer())
        .post(
          `/organizations/${organizationId}/collections/${collectionId}/transactions`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cooperativeId,
          memberId,
          type: 'contribution',
          amount: 300000,
          paymentMethod: 'cash',
        })
        .expect(400);
    });

    it('should approve collection', async () => {
      const response = await request(app.getHttpServer())
        .patch(
          `/organizations/${organizationId}/collections/${collectionId}/approve`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          approvalNotes: 'Approved for processing',
        })
        .expect(200);

      expect(response.body.status).toBe('approved');
      expect(response.body.approvedAt).toBeTruthy();
      expect(response.body.approvedBy).toBe(staffId);
    });

    it('should verify transactions posted to ledger', async () => {
      const collection = await prismaService.dailyCollection.findUnique({
        where: { id: collectionId },
        include: { transactions: true },
      });

      expect(collection?.transactions[0].status).toBe('posted');
      expect(collection?.transactions[0].postedAt).toBeTruthy();
    });
  });

  describe('Rejection Workflow', () => {
    let rejectCollectionId: string;

    it('should create and submit collection for rejection', async () => {
      // Create collection
      const createResponse = await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/collections`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collectionDate: new Date().toISOString(),
        })
        .expect(201);

      rejectCollectionId = createResponse.body.id;

      // Add transaction
      await request(app.getHttpServer())
        .post(
          `/organizations/${organizationId}/collections/${rejectCollectionId}/transactions`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cooperativeId,
          memberId,
          type: 'contribution',
          amount: 300000,
          paymentMethod: 'cash',
        })
        .expect(201);

      // Submit
      await request(app.getHttpServer())
        .patch(
          `/organizations/${organizationId}/collections/${rejectCollectionId}/submit`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should reject collection with reason', async () => {
      const response = await request(app.getHttpServer())
        .patch(
          `/organizations/${organizationId}/collections/${rejectCollectionId}/reject`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rejectionReason: 'Incomplete documentation',
        })
        .expect(200);

      expect(response.body.status).toBe('rejected');
      expect(response.body.rejectedAt).toBeTruthy();
      expect(response.body.rejectionReason).toBe('Incomplete documentation');
    });

    it('should verify transactions not posted after rejection', async () => {
      const collection = await prismaService.dailyCollection.findUnique({
        where: { id: rejectCollectionId },
        include: { transactions: true },
      });

      expect(collection?.transactions[0].status).toBe('pending');
      expect(collection?.transactions[0].postedAt).toBeNull();
    });
  });

  describe('Validation Rules', () => {
    let validationCollectionId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/collections`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collectionDate: new Date().toISOString(),
        })
        .expect(201);

      validationCollectionId = response.body.id;
    });

    it('should reject future collection date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/collections`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collectionDate: futureDate.toISOString(),
        })
        .expect(400);
    });

    it('should reject collection date > 30 days old', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);

      await request(app.getHttpServer())
        .post(`/organizations/${organizationId}/collections`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          collectionDate: oldDate.toISOString(),
        })
        .expect(400);
    });

    it('should reject invalid payment method', async () => {
      await request(app.getHttpServer())
        .post(
          `/organizations/${organizationId}/collections/${validationCollectionId}/transactions`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cooperativeId,
          memberId,
          type: 'contribution',
          amount: 500000,
          paymentMethod: 'cryptocurrency', // Invalid
        })
        .expect(400);
    });

    it('should reject submitting empty collection', async () => {
      await request(app.getHttpServer())
        .patch(
          `/organizations/${organizationId}/collections/${validationCollectionId}/submit`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('List and Filter Collections', () => {
    it('should list all collections', async () => {
      const response = await request(app.getHttpServer())
        .get(`/organizations/${organizationId}/collections`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/organizations/${organizationId}/collections?status=approved`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.every((c: any) => c.status === 'approved')).toBe(
        true,
      );
    });

    it('should filter by date range', async () => {
      const today = new Date().toISOString().split('T')[0];

      const response = await request(app.getHttpServer())
        .get(
          `/organizations/${organizationId}/collections?startDate=${today}&endDate=${today}`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Audit Statistics', () => {
    it('should get organization stats', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/organizations/${organizationId}/collections/audit/organization-stats`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalCollections');
      expect(response.body).toHaveProperty('approvedCount');
      expect(response.body).toHaveProperty('totalAmount');
    });

    it('should get transaction type stats', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/organizations/${organizationId}/collections/audit/transaction-types`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('type');
        expect(response.body[0]).toHaveProperty('count');
        expect(response.body[0]).toHaveProperty('totalAmount');
      }
    });

    it('should get daily trends', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/organizations/${organizationId}/collections/audit/daily-trends?days=7`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(7);
    });

    it('should get dashboard data', async () => {
      const response = await request(app.getHttpServer())
        .get(`/organizations/${organizationId}/collections/audit/dashboard`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('organizationStats');
      expect(response.body).toHaveProperty('transactionTypes');
      expect(response.body).toHaveProperty('dailyTrends');
    });
  });
});
