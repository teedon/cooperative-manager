import { Controller, Get, Put, Query, Param, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../admin-auth/admin-jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

interface Cooperative {
  id: string;
  name: string;
  registrationNumber: string;
  location?: string;
  memberCount: number;
  totalSavings: number;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
}

interface CooperativesResponse {
  cooperatives: Cooperative[];
  total: number;
  totalPages: number;
  currentPage: number;
}

@Controller('admin/cooperatives')
@UseGuards(AdminJwtAuthGuard)
export class AdminCooperativesController {
  
  constructor(private prisma: PrismaService) {}
  @Get()
  async getCooperatives(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: 'active' | 'pending' | 'suspended',
  ): Promise<CooperativesResponse> {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    // Build where clause
    const where: any = {};
    
    if (search) {
      const searchLower = search.toLowerCase();
      where.OR = [
        {
          name: {
            contains: searchLower,
            mode: 'insensitive'
          }
        },
        {
          code: {
            contains: searchLower,
            mode: 'insensitive'
          }
        }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    const [cooperatives, total] = await Promise.all([
      this.prisma.cooperative.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          _count: {
            select: {
              members: true
            }
          },
          members: {
            include: {
              contributionSubscriptions: {
                include: {
                  payments: {
                    where: {
                      status: 'approved'
                    },
                    select: {
                      amount: true
                    }
                  }
                }
              }
            }
          }
        }
      }),
      this.prisma.cooperative.count({ where })
    ]);
    
    const formattedCooperatives: Cooperative[] = cooperatives.map(coop => {
      // Calculate total savings from member contributions
      const totalSavings = coop.members.reduce((total, member) => {
        const memberContributions = member.contributionSubscriptions.reduce((memberTotal, sub) => {
          const subTotal = sub.payments.reduce((subPaymentTotal, payment) => {
            return subPaymentTotal + payment.amount;
          }, 0);
          return memberTotal + subTotal;
        }, 0);
        return total + memberContributions;
      }, 0);
      
      return {
        id: coop.id,
        name: coop.name,
        registrationNumber: coop.code,
        location: undefined, // Location field not in schema
        memberCount: coop._count.members,
        totalSavings,
        status: coop.status as 'active' | 'pending' | 'suspended',
        createdAt: coop.createdAt.toISOString()
      };
    });
    
    const totalPages = Math.ceil(total / limitNum);
    
    return {
      cooperatives: formattedCooperatives,
      total,
      totalPages,
      currentPage: pageNum,
    };
  }

  @Put(':id/status')
  async updateCooperativeStatus(
    @Param('id') cooperativeId: string,
    @Query('status') status: 'active' | 'pending' | 'suspended',
  ): Promise<{ success: boolean; message: string }> {
    try {
      const cooperative = await this.prisma.cooperative.findUnique({
        where: { id: cooperativeId }
      });
      
      if (!cooperative) {
        return {
          success: false,
          message: 'Cooperative not found'
        };
      }
      
      await this.prisma.cooperative.update({
        where: { id: cooperativeId },
        data: { status }
      });
      
      return {
        success: true,
        message: `Cooperative status updated to ${status}`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update cooperative status'
      };
    }
  }
}