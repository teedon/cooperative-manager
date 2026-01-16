import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { CollectionsService } from '../collections.service';

/**
 * Auto-posting scheduler for daily collections
 * Runs hourly via @Cron decorator or can be triggered manually
 */
@Injectable()
export class CollectionAutoPostScheduler {
  private readonly logger = new Logger(CollectionAutoPostScheduler.name);

  constructor(
    private prisma: PrismaService,
    private collectionsService: CollectionsService,
  ) {}

  /**
   * Check for collections eligible for auto-posting
   * Runs every hour via @Cron or call manually via API
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleAutoPosting() {
    this.logger.log('Starting auto-posting check for submitted collections...');

    try {
      // Get all organizations with auto-post settings enabled
      const organizations = await this.prisma.organization.findMany({
        where: {
          collectionSettings: {
            requireApproval: true,
            autoPostAfterHours: {
              gt: 0,
            },
          },
        },
        include: {
          collectionSettings: true,
        },
      });

      let autoPostedCount = 0;

      for (const org of organizations) {
        const autoPostAfterHours = org.collectionSettings?.autoPostAfterHours || 0;

        if (autoPostAfterHours === 0) continue;

        // Calculate cutoff time
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - autoPostAfterHours);

        // Find submitted collections that are past the cutoff
        const eligibleCollections = await this.prisma.dailyCollection.findMany({
          where: {
            organizationId: org.id,
            status: 'submitted',
            submittedAt: {
              lte: cutoffTime,
            },
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

        // Auto-approve each eligible collection
        for (const collection of eligibleCollections) {
          try {
            await this.autoApproveCollection(
              collection.id,
              org.id,
              autoPostAfterHours,
            );
            autoPostedCount++;

            this.logger.log(
              `Auto-approved collection ${collection.id} for staff ${collection.staff.user?.firstName} ${collection.staff.user?.lastName} (${autoPostAfterHours}h elapsed)`,
            );
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(
              `Failed to auto-approve collection ${collection.id}: ${errorMessage}`,
              errorStack,
            );
          }
        }
      }

      this.logger.log(
        `Auto-posting check completed. ${autoPostedCount} collection(s) auto-approved.`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        'Error during auto-posting check:',
        errorMessage,
        errorStack,
      );
    }
  }

  /**
   * Auto-approve a collection (system approval)
   */
  private async autoApproveCollection(
    collectionId: string,
    organizationId: string,
    hoursElapsed: number,
  ): Promise<void> {
    // Update collection to approved status
    await this.prisma.$transaction(async (tx) => {
      await tx.dailyCollection.update({
        where: { id: collectionId },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: 'SYSTEM', // System auto-approval
          approvalNotes: `Auto-approved after ${hoursElapsed} hours without supervisor review`,
        },
      });

      // Post transactions to ledger
      await this.collectionsService.postTransactions(collectionId, tx);
    });
  }

  /**
   * Manual trigger for auto-posting (can be called via API for testing)
   */
  async triggerAutoPosting(): Promise<{
    processed: number;
    errors: string[];
  }> {
    this.logger.log('Manual auto-posting trigger initiated...');

    const errors: string[] = [];
    let processed = 0;

    try {
      await this.handleAutoPosting();
      // Count how many were processed (approximate)
      const recentlyApproved = await this.prisma.dailyCollection.count({
        where: {
          approvedBy: 'SYSTEM',
          approvedAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
          },
        },
      });
      processed = recentlyApproved;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
    }

    return { processed, errors };
  }

  /**
   * Get pending auto-post statistics
   */
  async getAutoPostStats(): Promise<{
    pendingAutoPost: number;
    organizations: Array<{
      organizationId: string;
      autoPostAfterHours: number;
      pendingCount: number;
    }>;
  }> {
    const organizations = await this.prisma.organization.findMany({
      where: {
        collectionSettings: {
          autoPostAfterHours: {
            gt: 0,
          },
        },
      },
      include: {
        collectionSettings: true,
        _count: {
          select: {
            dailyCollections: {
              where: {
                status: 'submitted',
              },
            },
          },
        },
      },
    });

    let totalPending = 0;
    const orgStats = [];

    for (const org of organizations) {
      const autoPostAfterHours = org.collectionSettings?.autoPostAfterHours || 0;
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - autoPostAfterHours);

      const eligibleCount = await this.prisma.dailyCollection.count({
        where: {
          organizationId: org.id,
          status: 'submitted',
          submittedAt: {
            lte: cutoffTime,
          },
        },
      });

      totalPending += eligibleCount;

      orgStats.push({
        organizationId: org.id,
        autoPostAfterHours,
        pendingCount: eligibleCount,
      });
    }

    return {
      pendingAutoPost: totalPending,
      organizations: orgStats,
    };
  }
}
