import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Service for collection auditing and statistics
 */
@Injectable()
export class CollectionAuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get collection statistics for an organization
   */
  async getOrganizationStats(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalCollections: number;
    draftCollections: number;
    submittedCollections: number;
    approvedCollections: number;
    rejectedCollections: number;
    totalAmount: number;
    totalTransactions: number;
    averageCollectionAmount: number;
    averageTransactionsPerCollection: number;
  }> {
    const where: any = { organizationId };

    if (startDate || endDate) {
      where.collectionDate = {};
      if (startDate) where.collectionDate.gte = startDate;
      if (endDate) where.collectionDate.lte = endDate;
    }

    const [
      totalCollections,
      draftCollections,
      submittedCollections,
      approvedCollections,
      rejectedCollections,
      aggregates,
    ] = await Promise.all([
      this.prisma.dailyCollection.count({ where }),
      this.prisma.dailyCollection.count({
        where: { ...where, status: 'draft' },
      }),
      this.prisma.dailyCollection.count({
        where: { ...where, status: 'submitted' },
      }),
      this.prisma.dailyCollection.count({
        where: { ...where, status: 'approved' },
      }),
      this.prisma.dailyCollection.count({
        where: { ...where, status: 'rejected' },
      }),
      this.prisma.dailyCollection.aggregate({
        where,
        _sum: { totalAmount: true },
        _avg: { totalAmount: true, transactionCount: true },
      }),
    ]);

    return {
      totalCollections,
      draftCollections,
      submittedCollections,
      approvedCollections,
      rejectedCollections,
      totalAmount: aggregates._sum.totalAmount || 0,
      totalTransactions: totalCollections, // Approximate
      averageCollectionAmount: aggregates._avg.totalAmount || 0,
      averageTransactionsPerCollection: aggregates._avg.transactionCount || 0,
    };
  }

  /**
   * Get staff performance statistics
   */
  async getStaffStats(
    staffId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalCollections: number;
    approvedCollections: number;
    rejectedCollections: number;
    totalAmount: number;
    approvalRate: number;
    averageCollectionAmount: number;
  }> {
    const where: any = { staffId };

    if (startDate || endDate) {
      where.collectionDate = {};
      if (startDate) where.collectionDate.gte = startDate;
      if (endDate) where.collectionDate.lte = endDate;
    }

    const [totalCollections, approvedCollections, rejectedCollections, aggregates] =
      await Promise.all([
        this.prisma.dailyCollection.count({ where }),
        this.prisma.dailyCollection.count({
          where: { ...where, status: 'approved' },
        }),
        this.prisma.dailyCollection.count({
          where: { ...where, status: 'rejected' },
        }),
        this.prisma.dailyCollection.aggregate({
          where,
          _sum: { totalAmount: true },
          _avg: { totalAmount: true },
        }),
      ]);

    const approvalRate =
      totalCollections > 0 ? (approvedCollections / totalCollections) * 100 : 0;

    return {
      totalCollections,
      approvedCollections,
      rejectedCollections,
      totalAmount: aggregates._sum.totalAmount || 0,
      approvalRate,
      averageCollectionAmount: aggregates._avg.totalAmount || 0,
    };
  }

  /**
   * Get transaction type breakdown
   */
  async getTransactionTypeStats(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{
      type: string;
      count: number;
      totalAmount: number;
    }>
  > {
    const where: any = {
      dailyCollection: {
        organizationId,
      },
    };

    if (startDate || endDate) {
      where.dailyCollection.collectionDate = {};
      if (startDate) where.dailyCollection.collectionDate.gte = startDate;
      if (endDate) where.dailyCollection.collectionDate.lte = endDate;
    }

    const results = await this.prisma.collectionTransaction.groupBy({
      by: ['type'],
      where,
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
    });

    return results.map((r) => ({
      type: r.type,
      count: r._count.id,
      totalAmount: r._sum.amount || 0,
    }));
  }

  /**
   * Get rejection reasons summary
   */
  async getRejectionStats(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalRejections: number;
    rejectionReasons: Array<{
      reason: string;
      count: number;
    }>;
  }> {
    const where: any = {
      organizationId,
      status: 'rejected',
      rejectionReason: { not: null },
    };

    if (startDate || endDate) {
      where.collectionDate = {};
      if (startDate) where.collectionDate.gte = startDate;
      if (endDate) where.collectionDate.lte = endDate;
    }

    const rejections = await this.prisma.dailyCollection.findMany({
      where,
      select: {
        rejectionReason: true,
      },
    });

    // Group by reason
    const reasonMap = new Map<string, number>();
    rejections.forEach((r) => {
      if (r.rejectionReason) {
        const count = reasonMap.get(r.rejectionReason) || 0;
        reasonMap.set(r.rejectionReason, count + 1);
      }
    });

    const rejectionReasons = Array.from(reasonMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalRejections: rejections.length,
      rejectionReasons,
    };
  }

  /**
   * Get approval latency statistics
   */
  async getApprovalLatencyStats(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    averageLatencyHours: number;
    medianLatencyHours: number;
    minLatencyHours: number;
    maxLatencyHours: number;
  }> {
    const where: any = {
      organizationId,
      status: 'approved',
      submittedAt: { not: null },
      approvedAt: { not: null },
    };

    if (startDate || endDate) {
      where.collectionDate = {};
      if (startDate) where.collectionDate.gte = startDate;
      if (endDate) where.collectionDate.lte = endDate;
    }

    const collections = await this.prisma.dailyCollection.findMany({
      where,
      select: {
        submittedAt: true,
        approvedAt: true,
      },
    });

    if (collections.length === 0) {
      return {
        averageLatencyHours: 0,
        medianLatencyHours: 0,
        minLatencyHours: 0,
        maxLatencyHours: 0,
      };
    }

    // Calculate latencies in hours
    const latencies = collections
      .map((c) => {
        if (!c.submittedAt || !c.approvedAt) return null;
        const diff = c.approvedAt.getTime() - c.submittedAt.getTime();
        return diff / (1000 * 60 * 60); // Convert to hours
      })
      .filter((l): l is number => l !== null)
      .sort((a, b) => a - b);

    const sum = latencies.reduce((acc, l) => acc + l, 0);
    const average = sum / latencies.length;
    const median =
      latencies.length % 2 === 0
        ? (latencies[latencies.length / 2 - 1] + latencies[latencies.length / 2]) / 2
        : latencies[Math.floor(latencies.length / 2)];

    return {
      averageLatencyHours: Math.round(average * 10) / 10,
      medianLatencyHours: Math.round(median * 10) / 10,
      minLatencyHours: Math.round(latencies[0] * 10) / 10,
      maxLatencyHours: Math.round(latencies[latencies.length - 1] * 10) / 10,
    };
  }

  /**
   * Get daily collection trends
   */
  async getDailyTrends(
    organizationId: string,
    days: number = 30,
  ): Promise<
    Array<{
      date: string;
      collections: number;
      amount: number;
      transactions: number;
    }>
  > {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const collections = await this.prisma.dailyCollection.findMany({
      where: {
        organizationId,
        collectionDate: {
          gte: startDate,
        },
        status: 'approved',
      },
      select: {
        collectionDate: true,
        totalAmount: true,
        transactionCount: true,
      },
      orderBy: {
        collectionDate: 'asc',
      },
    });

    // Group by date
    const trendMap = new Map<
      string,
      { collections: number; amount: number; transactions: number }
    >();

    collections.forEach((c) => {
      const dateKey = c.collectionDate.toISOString().split('T')[0];
      const existing = trendMap.get(dateKey) || {
        collections: 0,
        amount: 0,
        transactions: 0,
      };

      trendMap.set(dateKey, {
        collections: existing.collections + 1,
        amount: existing.amount + c.totalAmount,
        transactions: existing.transactions + c.transactionCount,
      });
    });

    return Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Create audit log entry
   */
  async logAction(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    // This would create an audit log entry
    // For now, just logging to console
    console.log('Audit Log:', {
      userId,
      action,
      entityType,
      entityId,
      metadata,
      timestamp: new Date(),
    });

    // In production, store in database:
    // await this.prisma.auditLog.create({
    //   data: {
    //     userId,
    //     action,
    //     entityType,
    //     entityId,
    //     metadata,
    //   },
    // });
  }
}
