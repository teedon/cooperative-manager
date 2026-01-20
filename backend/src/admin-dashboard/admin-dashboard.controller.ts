import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../admin-auth/admin-jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

interface DashboardStats {
  totalUsers: number;
  totalCooperatives: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  userGrowth: number;
  cooperativeGrowth: number;
  subscriptionGrowth: number;
  revenueGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'cooperative_created' | 'subscription_upgraded' | 'support_ticket' | 'cooperative_verified';
  description: string;
  entityName: string;
  timestamp: string;
}

@Controller('admin/dashboard')
@UseGuards(AdminJwtAuthGuard)
export class AdminDashboardController {
  
  constructor(private prisma: PrismaService) {}
  
  @Get('stats')
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Get total counts
    const totalUsers = await this.prisma.user.count();
    const totalCooperatives = await this.prisma.cooperative.count();
    const activeSubscriptions = await this.prisma.subscription.count({
      where: {
        status: 'active'
      }
    });

    // Calculate monthly revenue
    const activeSubscriptionsWithPlan = await this.prisma.subscription.findMany({
      where: {
        status: 'active'
      },
      include: {
        plan: true
      }
    });
    
    const monthlyRevenue = activeSubscriptionsWithPlan.reduce((total, sub) => {
      const planPrice = sub.billingCycle === 'yearly' ? sub.plan.yearlyPrice / 12 : sub.plan.monthlyPrice;
      return total + (planPrice || 0);
    }, 0);

    // Calculate growth rates
    const usersLastMonth = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        }
      }
    });
    const usersPreviousMonth = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        }
      }
    });
    const userGrowth = usersPreviousMonth > 0 ? ((usersLastMonth - usersPreviousMonth) / usersPreviousMonth) * 100 : 0;

    const cooperativesLastMonth = await this.prisma.cooperative.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        }
      }
    });
    const cooperativesPreviousMonth = await this.prisma.cooperative.count({
      where: {
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        }
      }
    });
    const cooperativeGrowth = cooperativesPreviousMonth > 0 ? ((cooperativesLastMonth - cooperativesPreviousMonth) / cooperativesPreviousMonth) * 100 : 0;

    const subscriptionsLastMonth = await this.prisma.subscription.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        }
      }
    });
    const subscriptionsPreviousMonth = await this.prisma.subscription.count({
      where: {
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        }
      }
    });
    const subscriptionGrowth = subscriptionsPreviousMonth > 0 ? ((subscriptionsLastMonth - subscriptionsPreviousMonth) / subscriptionsPreviousMonth) * 100 : 0;

    return {
      totalUsers,
      totalCooperatives,
      activeSubscriptions,
      monthlyRevenue: Math.round(monthlyRevenue),
      userGrowth: Math.round(userGrowth * 100) / 100,
      cooperativeGrowth: Math.round(cooperativeGrowth * 100) / 100,
      subscriptionGrowth: Math.round(subscriptionGrowth * 100) / 100,
      revenueGrowth: 0, // Could implement revenue growth calculation later
    };
  }

  @Get('recent-activity')
  async getRecentActivity(): Promise<RecentActivity[]> {
    const activities: RecentActivity[] = [];
    const limit = 10;
    
    // Get recent user registrations
    const recentUsers = await this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });
    
    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: 'user_registered',
        description: 'New user registered',
        entityName: `${user.firstName} ${user.lastName}`,
        timestamp: user.createdAt.toISOString()
      });
    });
    
    // Get recent cooperative creations
    const recentCooperatives = await this.prisma.cooperative.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    });
    
    recentCooperatives.forEach(coop => {
      activities.push({
        id: `coop-${coop.id}`,
        type: 'cooperative_created',
        description: 'New cooperative registered',
        entityName: coop.name,
        timestamp: coop.createdAt.toISOString()
      });
    });
    
    // Get recent subscription upgrades
    const recentSubscriptions = await this.prisma.subscription.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      include: {
        cooperative: {
          select: {
            name: true
          }
        },
        plan: {
          select: {
            name: true
          }
        }
      }
    });
    
    recentSubscriptions.forEach(sub => {
      activities.push({
        id: `sub-${sub.id}`,
        type: 'subscription_upgraded',
        description: `Subscription upgraded to ${sub.plan.name}`,
        entityName: sub.cooperative.name,
        timestamp: sub.createdAt.toISOString()
      });
    });
    
    // Sort all activities by timestamp (most recent first) and limit to 10
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }
}