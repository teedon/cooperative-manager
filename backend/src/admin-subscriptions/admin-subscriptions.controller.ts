import { Controller, Get, Put, Query, Param, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../admin-auth/admin-jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

interface Subscription {
  id: string;
  cooperativeName: string;
  plan: 'basic' | 'premium' | 'enterprise';
  amount: number;
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  nextBillingDate?: string;
}

interface SubscriptionsResponse {
  subscriptions: Subscription[];
  total: number;
  totalPages: number;
  currentPage: number;
}

interface RevenueStats {
  monthlyRevenue: number;
  totalRevenue: number;
  averageRevenuePerUser: number;
  churnRate: number;
  revenueGrowth: number;
}

@Controller('admin/subscriptions')
@UseGuards(AdminJwtAuthGuard)
export class AdminSubscriptionsController {
  
  constructor(private prisma: PrismaService) {}
  @Get()
  async getSubscriptions(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: 'active' | 'cancelled' | 'expired',
    @Query('plan') plan?: 'basic' | 'premium' | 'enterprise',
  ): Promise<SubscriptionsResponse> {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    // Build where clause
    const where: any = {};
    
    if (search) {
      where.cooperative = {
        name: {
          contains: search,
          mode: 'insensitive'
        }
      };
    }
    
    if (status) {
      where.status = status;
    }
    
    if (plan) {
      where.plan = {
        name: {
          contains: plan,
          mode: 'insensitive'
        }
      };
    }
    
    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          cooperative: {
            select: {
              name: true
            }
          },
          plan: {
            select: {
              name: true,
              monthlyPrice: true,
              yearlyPrice: true
            }
          }
        }
      }),
      this.prisma.subscription.count({ where })
    ]);
    
    const formattedSubscriptions: Subscription[] = subscriptions.map(sub => {
      // Calculate amount based on billing cycle
      const amount = sub.billingCycle === 'yearly' ? sub.plan.yearlyPrice : sub.plan.monthlyPrice;
      
      // Calculate next billing date
      const nextBillingDate = sub.status === 'active' ? sub.currentPeriodEnd.toISOString() : undefined;
      
      return {
        id: sub.id,
        cooperativeName: sub.cooperative.name,
        plan: sub.plan.name.toLowerCase() as 'basic' | 'premium' | 'enterprise',
        amount: amount || 0,
        status: sub.status as 'active' | 'cancelled' | 'expired',
        startDate: sub.currentPeriodStart.toISOString(),
        nextBillingDate
      };
    });
    
    const totalPages = Math.ceil(total / limitNum);
    
    return {
      subscriptions: formattedSubscriptions,
      total,
      totalPages,
      currentPage: pageNum,
    };
  }

  @Get('revenue-stats')
  async getRevenueStats(): Promise<RevenueStats> {
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'active'
      },
      include: {
        plan: {
          select: {
            monthlyPrice: true,
            yearlyPrice: true
          }
        }
      }
    });
    
    const totalSubscriptions = await this.prisma.subscription.count();
    const cancelledSubscriptions = await this.prisma.subscription.count({
      where: {
        status: 'cancelled'
      }
    });
    
    // Calculate monthly revenue
    const monthlyRevenue = activeSubscriptions.reduce((total, sub) => {
      const planPrice = sub.billingCycle === 'yearly' ? sub.plan.yearlyPrice / 12 : sub.plan.monthlyPrice;
      return total + (planPrice || 0);
    }, 0);
    
    // Calculate total revenue (all time)
    const allSubscriptions = await this.prisma.subscription.findMany({
      include: {
        plan: {
          select: {
            monthlyPrice: true,
            yearlyPrice: true
          }
        }
      }
    });
    
    const totalRevenue = allSubscriptions.reduce((total, sub) => {
      const planPrice = sub.plan.monthlyPrice || 0;
      // This is a simplified calculation - in reality you'd want to track actual payments
      return total + planPrice;
    }, 0);
    
    const averageRevenuePerUser = activeSubscriptions.length > 0 ? monthlyRevenue / activeSubscriptions.length : 0;
    const churnRate = totalSubscriptions > 0 ? (cancelledSubscriptions / totalSubscriptions) * 100 : 0;
    
    return {
      monthlyRevenue: Math.round(monthlyRevenue),
      totalRevenue: Math.round(totalRevenue),
      averageRevenuePerUser: Math.round(averageRevenuePerUser),
      churnRate: Math.round(churnRate * 100) / 100,
      revenueGrowth: 0, // Could implement growth calculation later
    };
  }

  @Put(':id/status')
  async updateSubscriptionStatus(
    @Param('id') subscriptionId: string,
    @Query('status') status: 'active' | 'cancelled' | 'expired',
  ): Promise<{ success: boolean; message: string }> {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });
      
      if (!subscription) {
        return {
          success: false,
          message: 'Subscription not found'
        };
      }
      
      await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: { 
          status,
          cancelledAt: status === 'cancelled' ? new Date() : null
        }
      });
      
      return {
        success: true,
        message: `Subscription status updated to ${status}`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update subscription status'
      };
    }
  }
}