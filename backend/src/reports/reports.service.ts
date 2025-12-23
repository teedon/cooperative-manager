import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ReportType,
  ReportMetadata,
  ContributionSummaryReport,
  MemberBalancesReport,
  LoanSummaryReport,
  LoanRepaymentReport,
  ExpenseSummaryReport,
  FinancialStatementReport,
  MemberActivityReport,
} from './dto/report.dto';
import {
  PERMISSIONS,
  hasPermission,
  parsePermissions,
} from '../common/permissions';
import {
  generateCsv,
  generateExcelXml,
  REPORT_COLUMNS,
  flattenReportData,
} from './utils/export.util';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private async verifyAccess(cooperativeId: string, userId: string): Promise<any> {
    const member = await this.prisma.member.findFirst({
      where: { cooperativeId, userId, status: 'active' },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    const permissions = parsePermissions(member.permissions);
    if (!hasPermission(member.role, permissions, PERMISSIONS.REPORTS_VIEW)) {
      throw new ForbiddenException('You do not have permission to view reports');
    }

    return member;
  }

  private async getCooperativeName(cooperativeId: string): Promise<string> {
    const coop = await this.prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      select: { name: true },
    });
    return coop?.name || 'Unknown Cooperative';
  }

  private createMetadata(
    reportType: ReportType,
    cooperativeId: string,
    cooperativeName: string,
    generatedBy: string,
    startDate?: string,
    endDate?: string,
    filters?: Record<string, string>,
  ): ReportMetadata {
    return {
      reportType,
      cooperativeId,
      cooperativeName,
      generatedAt: new Date().toISOString(),
      generatedBy,
      dateRange: startDate || endDate ? { startDate, endDate } : undefined,
      filters,
    };
  }

  private getDateFilter(startDate?: string, endDate?: string) {
    const filter: any = {};
    if (startDate) filter.gte = new Date(startDate);
    if (endDate) filter.lte = new Date(endDate);
    return Object.keys(filter).length ? filter : undefined;
  }

  async generateReport(
    cooperativeId: string,
    userId: string,
    reportType: ReportType,
    options: {
      startDate?: string;
      endDate?: string;
      memberId?: string;
      planId?: string;
    } = {},
  ) {
    await this.verifyAccess(cooperativeId, userId);

    switch (reportType) {
      case 'contribution_summary':
        return this.generateContributionSummary(cooperativeId, userId, options);
      case 'member_balances':
        return this.generateMemberBalances(cooperativeId, userId, options);
      case 'loan_summary':
        return this.generateLoanSummary(cooperativeId, userId, options);
      case 'loan_repayment':
        return this.generateLoanRepayment(cooperativeId, userId, options);
      case 'loan_interest':
        return this.generateLoanInterestReport(cooperativeId, userId, options);
      case 'expense_summary':
        return this.generateExpenseSummary(cooperativeId, userId, options);
      case 'financial_statement':
        return this.generateFinancialStatement(cooperativeId, userId, options);
      case 'member_activity':
        return this.generateMemberActivity(cooperativeId, userId, options);
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  async generateContributionSummary(
    cooperativeId: string,
    userId: string,
    options: { startDate?: string; endDate?: string; planId?: string },
  ): Promise<ContributionSummaryReport> {
    const cooperativeName = await this.getCooperativeName(cooperativeId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const dateFilter = this.getDateFilter(options.startDate, options.endDate);

    // Build payment filter
    const paymentWhere: any = {
      subscription: { plan: { cooperativeId } },
    };
    if (dateFilter) paymentWhere.createdAt = dateFilter;
    if (options.planId) paymentWhere.subscription = { ...paymentWhere.subscription, planId: options.planId };

    // Get all payments
    const payments = await this.prisma.contributionPayment.findMany({
      where: paymentWhere,
      include: {
        subscription: {
          include: {
            plan: true,
            member: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
    });

    // Calculate summary
    const approvedPayments = payments.filter(p => p.status === 'approved');
    const totalContributions = approvedPayments.reduce((sum, p) => sum + p.amount, 0);

    // Group by plan
    const byPlanMap = new Map<string, { plan: any; amount: number; count: number; subscribers: Set<string> }>();
    for (const payment of approvedPayments) {
      const planId = payment.subscription.planId;
      if (!byPlanMap.has(planId)) {
        byPlanMap.set(planId, {
          plan: payment.subscription.plan,
          amount: 0,
          count: 0,
          subscribers: new Set(),
        });
      }
      const entry = byPlanMap.get(planId)!;
      entry.amount += payment.amount;
      entry.count += 1;
      entry.subscribers.add(payment.memberId);
    }

    // Group by month
    const byMonthMap = new Map<string, { amount: number; count: number }>();
    for (const payment of approvedPayments) {
      const month = new Date(payment.approvedAt || payment.createdAt).toISOString().slice(0, 7);
      if (!byMonthMap.has(month)) {
        byMonthMap.set(month, { amount: 0, count: 0 });
      }
      const entry = byMonthMap.get(month)!;
      entry.amount += payment.amount;
      entry.count += 1;
    }

    // Top contributors
    const contributorMap = new Map<string, { name: string; amount: number; count: number }>();
    for (const payment of approvedPayments) {
      const memberId = payment.memberId;
      const member = payment.subscription.member;
      const name = member.user
        ? `${member.user.firstName} ${member.user.lastName}`
        : `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown';
      
      if (!contributorMap.has(memberId)) {
        contributorMap.set(memberId, { name, amount: 0, count: 0 });
      }
      const entry = contributorMap.get(memberId)!;
      entry.amount += payment.amount;
      entry.count += 1;
    }

    const topContributors = Array.from(contributorMap.entries())
      .map(([memberId, data]) => ({ memberId, memberName: data.name, totalAmount: data.amount, paymentCount: data.count }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    const uniqueContributors = new Set(approvedPayments.map(p => p.memberId)).size;

    return {
      metadata: this.createMetadata(
        'contribution_summary',
        cooperativeId,
        cooperativeName,
        user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        options.startDate,
        options.endDate,
      ),
      summary: {
        totalContributions,
        totalPayments: payments.length,
        pendingPayments: payments.filter(p => p.status === 'pending').length,
        approvedPayments: approvedPayments.length,
        rejectedPayments: payments.filter(p => p.status === 'rejected').length,
        uniqueContributors,
      },
      byPlan: Array.from(byPlanMap.entries()).map(([planId, data]) => ({
        planId,
        planName: data.plan.name,
        category: data.plan.category,
        totalAmount: data.amount,
        paymentCount: data.count,
        subscriberCount: data.subscribers.size,
      })),
      byMonth: Array.from(byMonthMap.entries())
        .map(([month, data]) => ({ month, totalAmount: data.amount, paymentCount: data.count }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      topContributors,
    };
  }

  async generateMemberBalances(
    cooperativeId: string,
    userId: string,
    options: { startDate?: string; endDate?: string },
  ): Promise<MemberBalancesReport> {
    const cooperativeName = await this.getCooperativeName(cooperativeId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    const members = await this.prisma.member.findMany({
      where: { cooperativeId, status: 'active' },
      include: {
        user: { select: { firstName: true, lastName: true } },
        contributionPayments: {
          where: { status: 'approved' },
          select: { amount: true },
        },
        loans: {
          where: { status: { in: ['disbursed', 'repaying', 'completed'] } },
          include: {
            repaymentSchedules: {
              where: { status: 'paid' },
              select: { paidAmount: true },
            },
          },
        },
      },
    });

    const memberData = members.map(member => {
      const name = member.user
        ? `${member.user.firstName} ${member.user.lastName}`
        : `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown';
      
      const totalContributions = member.contributionPayments.reduce((sum: number, p) => sum + p.amount, 0);
      const totalLoansTaken = member.loans.reduce((sum: number, l) => sum + l.amountDisbursed, 0);
      const totalLoanRepayments = member.loans.reduce(
        (sum: number, l) => sum + l.repaymentSchedules.reduce((s: number, r) => s + r.paidAmount, 0),
        0
      );
      const currentBalance = totalContributions + totalLoanRepayments - totalLoansTaken;

      return {
        memberId: member.id,
        memberName: name,
        memberCode: member.memberCode || undefined,
        isOfflineMember: member.isOfflineMember,
        joinedAt: member.joinedAt.toISOString(),
        totalContributions,
        totalLoansTaken,
        totalLoanRepayments,
        currentBalance,
      };
    });

    const totalBalance = memberData.reduce((sum, m) => sum + m.currentBalance, 0);
    const totalContributions = memberData.reduce((sum, m) => sum + m.totalContributions, 0);
    const totalLoans = memberData.reduce((sum, m) => sum + m.totalLoansTaken, 0);

    return {
      metadata: this.createMetadata(
        'member_balances',
        cooperativeId,
        cooperativeName,
        user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        options.startDate,
        options.endDate,
      ),
      summary: {
        totalMembers: members.length,
        totalBalance,
        averageBalance: members.length > 0 ? totalBalance / members.length : 0,
        totalContributions,
        totalLoans,
      },
      members: memberData.sort((a, b) => b.currentBalance - a.currentBalance),
    };
  }

  async generateLoanSummary(
    cooperativeId: string,
    userId: string,
    options: { startDate?: string; endDate?: string },
  ): Promise<LoanSummaryReport> {
    const cooperativeName = await this.getCooperativeName(cooperativeId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const dateFilter = this.getDateFilter(options.startDate, options.endDate);

    const loanWhere: any = { cooperativeId };
    if (dateFilter) loanWhere.createdAt = dateFilter;

    const loans = await this.prisma.loan.findMany({
      where: loanWhere,
      include: {
        loanType: true,
        member: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        repaymentSchedules: true,
      },
    });

    const disbursedLoans = loans.filter(l => ['disbursed', 'repaying', 'completed'].includes(l.status));
    const totalAmountDisbursed = disbursedLoans.reduce((sum, l) => sum + l.amountDisbursed, 0);
    const totalInterestEarned = disbursedLoans.reduce((sum, l) => sum + l.interestAmount, 0);
    const totalApplicationFees = disbursedLoans.reduce((sum, l) => sum + (l.applicationFee || 0), 0);

    const totalRepaid = disbursedLoans.reduce(
      (sum, l) => sum + l.repaymentSchedules.filter((r: any) => r.status === 'paid').reduce((s: number, r: any) => s + r.paidAmount, 0),
      0
    );
    const totalExpected = disbursedLoans.reduce(
      (sum, l) => sum + l.repaymentSchedules.reduce((s: number, r: any) => s + r.amount, 0),
      0
    );
    const repaymentRate = totalExpected > 0 ? (totalRepaid / totalExpected) * 100 : 100;

    // By loan type
    const byLoanTypeMap = new Map<string, any>();
    for (const loan of disbursedLoans) {
      const typeId = loan.loanTypeId || 'default';
      if (!byLoanTypeMap.has(typeId)) {
        byLoanTypeMap.set(typeId, {
          loanType: loan.loanType,
          count: 0,
          disbursed: 0,
          repaid: 0,
          interest: 0,
        });
      }
      const entry = byLoanTypeMap.get(typeId)!;
      entry.count += 1;
      entry.disbursed += loan.amountDisbursed;
      entry.interest += loan.interestAmount;
      entry.repaid += loan.repaymentSchedules.filter((r: any) => r.status === 'paid').reduce((s: number, r: any) => s + r.paidAmount, 0);
    }

    // By month
    const byMonthMap = new Map<string, { issued: number; disbursed: number; repaid: number }>();
    for (const loan of disbursedLoans) {
      const month = new Date(loan.disbursedAt || loan.createdAt).toISOString().slice(0, 7);
      if (!byMonthMap.has(month)) {
        byMonthMap.set(month, { issued: 0, disbursed: 0, repaid: 0 });
      }
      const entry = byMonthMap.get(month)!;
      entry.issued += 1;
      entry.disbursed += loan.amountDisbursed;
    }

    // Add repayments to months
    for (const loan of disbursedLoans) {
      for (const rep of loan.repaymentSchedules.filter((r: any) => r.status === 'paid')) {
        const month = new Date(rep.paidAt!).toISOString().slice(0, 7);
        if (!byMonthMap.has(month)) {
          byMonthMap.set(month, { issued: 0, disbursed: 0, repaid: 0 });
        }
        byMonthMap.get(month)!.repaid += rep.paidAmount;
      }
    }

    // Top borrowers
    const borrowerMap = new Map<string, any>();
    for (const loan of disbursedLoans) {
      const memberId = loan.memberId;
      const member = loan.member;
      const name = member.user
        ? `${member.user.firstName} ${member.user.lastName}`
        : `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown';

      if (!borrowerMap.has(memberId)) {
        borrowerMap.set(memberId, { name, borrowed: 0, repaid: 0, activeCount: 0 });
      }
      const entry = borrowerMap.get(memberId)!;
      entry.borrowed += loan.amountDisbursed;
      entry.repaid += loan.repaymentSchedules.filter((r: any) => r.status === 'paid').reduce((s: number, r: any) => s + r.paidAmount, 0);
      if (['disbursed', 'repaying'].includes(loan.status)) entry.activeCount += 1;
    }

    return {
      metadata: this.createMetadata(
        'loan_summary',
        cooperativeId,
        cooperativeName,
        user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        options.startDate,
        options.endDate,
      ),
      summary: {
        totalLoansIssued: disbursedLoans.length,
        totalAmountDisbursed,
        totalInterestEarned,
        totalApplicationFees,
        activeLoans: loans.filter(l => ['disbursed', 'repaying'].includes(l.status)).length,
        completedLoans: loans.filter(l => l.status === 'completed').length,
        pendingLoans: loans.filter(l => l.status === 'pending').length,
        defaultedLoans: loans.filter(l => l.status === 'defaulted').length,
        repaymentRate: Math.round(repaymentRate * 100) / 100,
      },
      byLoanType: Array.from(byLoanTypeMap.entries()).map(([loanTypeId, data]) => ({
        loanTypeId,
        loanTypeName: data.loanType?.name || 'Unknown',
        loanCount: data.count,
        totalDisbursed: data.disbursed,
        totalRepaid: data.repaid,
        interestEarned: data.interest,
      })),
      byMonth: Array.from(byMonthMap.entries())
        .map(([month, data]) => ({
          month,
          loansIssued: data.issued,
          amountDisbursed: data.disbursed,
          amountRepaid: data.repaid,
        }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      topBorrowers: Array.from(borrowerMap.entries())
        .map(([memberId, data]) => ({
          memberId,
          memberName: data.name,
          totalBorrowed: data.borrowed,
          totalRepaid: data.repaid,
          activeLoans: data.activeCount,
        }))
        .sort((a, b) => b.totalBorrowed - a.totalBorrowed)
        .slice(0, 10),
    };
  }

  async generateLoanRepayment(
    cooperativeId: string,
    userId: string,
    options: { startDate?: string; endDate?: string },
  ): Promise<LoanRepaymentReport> {
    const cooperativeName = await this.getCooperativeName(cooperativeId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    const activeLoans = await this.prisma.loan.findMany({
      where: {
        cooperativeId,
        status: { in: ['disbursed', 'repaying'] },
      },
      include: {
        member: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        repaymentSchedules: true,
      },
    });

    const today = new Date();
    const overdueRepayments: any[] = [];
    const upcomingRepayments: any[] = [];
    let totalExpected = 0;
    let totalActual = 0;
    let overdueAmount = 0;

    for (const loan of activeLoans) {
      const memberName = loan.member.user
        ? `${loan.member.user.firstName} ${loan.member.user.lastName}`
        : `${loan.member.firstName || ''} ${loan.member.lastName || ''}`.trim() || 'Unknown';

      for (const schedule of loan.repaymentSchedules) {
        totalExpected += schedule.totalAmount;
        
        if (schedule.status === 'paid') {
          totalActual += schedule.paidAmount;
        } else if (schedule.status === 'pending') {
          const dueDate = new Date(schedule.dueDate);
          if (dueDate < today) {
            const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            overdueAmount += schedule.totalAmount;
            overdueRepayments.push({
              loanId: loan.id,
              memberId: loan.memberId,
              memberName,
              dueDate: schedule.dueDate.toISOString(),
              amountDue: schedule.totalAmount,
              daysOverdue,
            });
          } else {
            upcomingRepayments.push({
              loanId: loan.id,
              memberId: loan.memberId,
              memberName,
              dueDate: schedule.dueDate.toISOString(),
              amountDue: schedule.totalAmount,
            });
          }
        }
      }
    }

    // Get recent repayment history
    const recentRepayments = await this.prisma.loanRepaymentSchedule.findMany({
      where: {
        loan: { cooperativeId },
        status: 'paid',
      },
      include: {
        loan: {
          include: {
            member: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
      take: 50,
    });

    return {
      metadata: this.createMetadata(
        'loan_repayment',
        cooperativeId,
        cooperativeName,
        user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        options.startDate,
        options.endDate,
      ),
      summary: {
        totalExpectedRepayments: totalExpected,
        totalActualRepayments: totalActual,
        overdueAmount,
        repaymentPercentage: totalExpected > 0 ? Math.round((totalActual / totalExpected) * 10000) / 100 : 100,
        totalPenalties: 0, // Could calculate from penalties if tracked
      },
      overdueRepayments: overdueRepayments.sort((a, b) => b.daysOverdue - a.daysOverdue),
      upcomingRepayments: upcomingRepayments
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 20),
      repaymentHistory: recentRepayments.map(r => ({
        loanId: r.loanId,
        memberId: r.loan.memberId,
        memberName: r.loan.member.user
          ? `${r.loan.member.user.firstName} ${r.loan.member.user.lastName}`
          : `${r.loan.member.firstName || ''} ${r.loan.member.lastName || ''}`.trim() || 'Unknown',
        paidAt: r.paidAt!.toISOString(),
        amountPaid: r.paidAmount,
        wasLate: r.paidAt! > r.dueDate,
      })),
    };
  }

  async generateLoanInterestReport(
    cooperativeId: string,
    userId: string,
    options: { startDate?: string; endDate?: string },
  ): Promise<any> {
    const cooperativeName = await this.getCooperativeName(cooperativeId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const dateFilter = this.getDateFilter(options.startDate, options.endDate);

    // Get all loans with interest data
    const loanWhere: any = {
      cooperativeId,
      status: { in: ['disbursed', 'repaying', 'completed'] },
    };
    if (dateFilter) loanWhere.disbursedAt = dateFilter;

    const loans = await this.prisma.loan.findMany({
      where: loanWhere,
      include: {
        member: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        loanType: true,
        repaymentSchedules: {
          where: { status: 'paid' },
          select: { interestAmount: true, paidAmount: true },
        },
      },
      orderBy: { disbursedAt: 'desc' },
    });

    // Calculate totals
    let totalInterestExpected = 0;
    let totalInterestEarned = 0;
    let totalRateSum = 0;

    const byLoanTypeMap = new Map<string, {
      loanType: any;
      totalLoans: number;
      totalPrincipal: number;
      totalInterestExpected: number;
      totalInterestEarned: number;
    }>();

    const byMonthMap = new Map<string, {
      interestEarned: number;
      loansIssued: number;
      principalDisbursed: number;
      rateSum: number;
      rateCount: number;
    }>();

    const byMemberMap = new Map<string, {
      name: string;
      totalLoans: number;
      totalPrincipal: number;
      totalInterestPaid: number;
      totalInterestPending: number;
    }>();

    const loanDetails: any[] = [];

    for (const loan of loans) {
      const interestExpected = loan.interestAmount;
      const interestPaid = loan.repaymentSchedules.reduce((sum, s) => sum + s.interestAmount, 0);
      const interestPending = interestExpected - interestPaid;

      totalInterestExpected += interestExpected;
      totalInterestEarned += interestPaid;
      totalRateSum += loan.interestRate;

      const memberName = loan.member.user
        ? `${loan.member.user.firstName} ${loan.member.user.lastName}`
        : `${loan.member.firstName || ''} ${loan.member.lastName || ''}`.trim() || 'Unknown';

      // By loan type
      const loanTypeId = loan.loanTypeId || 'default';
      if (!byLoanTypeMap.has(loanTypeId)) {
        byLoanTypeMap.set(loanTypeId, {
          loanType: loan.loanType,
          totalLoans: 0,
          totalPrincipal: 0,
          totalInterestExpected: 0,
          totalInterestEarned: 0,
        });
      }
      const typeEntry = byLoanTypeMap.get(loanTypeId)!;
      typeEntry.totalLoans += 1;
      typeEntry.totalPrincipal += loan.amount;
      typeEntry.totalInterestExpected += interestExpected;
      typeEntry.totalInterestEarned += interestPaid;

      // By month
      if (loan.disbursedAt) {
        const month = loan.disbursedAt.toISOString().slice(0, 7);
        if (!byMonthMap.has(month)) {
          byMonthMap.set(month, {
            interestEarned: 0,
            loansIssued: 0,
            principalDisbursed: 0,
            rateSum: 0,
            rateCount: 0,
          });
        }
        const monthEntry = byMonthMap.get(month)!;
        monthEntry.interestEarned += interestPaid;
        monthEntry.loansIssued += 1;
        monthEntry.principalDisbursed += loan.amountDisbursed;
        monthEntry.rateSum += loan.interestRate;
        monthEntry.rateCount += 1;
      }

      // By member
      if (!byMemberMap.has(loan.memberId)) {
        byMemberMap.set(loan.memberId, {
          name: memberName,
          totalLoans: 0,
          totalPrincipal: 0,
          totalInterestPaid: 0,
          totalInterestPending: 0,
        });
      }
      const memberEntry = byMemberMap.get(loan.memberId)!;
      memberEntry.totalLoans += 1;
      memberEntry.totalPrincipal += loan.amount;
      memberEntry.totalInterestPaid += interestPaid;
      memberEntry.totalInterestPending += interestPending;

      // Loan details
      loanDetails.push({
        loanId: loan.id,
        memberId: loan.memberId,
        memberName,
        loanTypeName: loan.loanType?.name || 'Standard Loan',
        principalAmount: loan.amount,
        interestRate: loan.interestRate,
        interestAmount: interestExpected,
        interestPaid,
        interestPending,
        status: loan.status,
        disbursedAt: loan.disbursedAt?.toISOString() || '',
      });
    }

    const averageInterestRate = loans.length > 0 ? totalRateSum / loans.length : 0;
    const totalInterestPending = totalInterestExpected - totalInterestEarned;

    return {
      metadata: this.createMetadata(
        'loan_interest',
        cooperativeId,
        cooperativeName,
        user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        options.startDate,
        options.endDate,
      ),
      summary: {
        totalInterestEarned,
        totalInterestExpected,
        totalInterestPending,
        averageInterestRate: Math.round(averageInterestRate * 100) / 100,
        totalLoansWithInterest: loans.length,
        interestEarnedThisPeriod: totalInterestEarned,
      },
      byLoanType: Array.from(byLoanTypeMap.entries()).map(([loanTypeId, data]) => ({
        loanTypeId,
        loanTypeName: data.loanType?.name || 'Standard Loan',
        interestRate: data.loanType?.interestRate || 0,
        totalLoans: data.totalLoans,
        totalPrincipal: data.totalPrincipal,
        totalInterestExpected: data.totalInterestExpected,
        totalInterestEarned: data.totalInterestEarned,
        interestPending: data.totalInterestExpected - data.totalInterestEarned,
      })),
      byMonth: Array.from(byMonthMap.entries())
        .map(([month, data]) => ({
          month,
          interestEarned: data.interestEarned,
          loansIssued: data.loansIssued,
          principalDisbursed: data.principalDisbursed,
          averageRate: data.rateCount > 0 ? Math.round((data.rateSum / data.rateCount) * 100) / 100 : 0,
        }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      loanDetails: loanDetails.slice(0, 100),
      interestByMember: Array.from(byMemberMap.entries())
        .map(([memberId, data]) => ({
          memberId,
          memberName: data.name,
          totalLoans: data.totalLoans,
          totalPrincipal: data.totalPrincipal,
          totalInterestPaid: data.totalInterestPaid,
          totalInterestPending: data.totalInterestPending,
        }))
        .sort((a, b) => b.totalInterestPaid - a.totalInterestPaid),
    };
  }

  async generateExpenseSummary(
    cooperativeId: string,
    userId: string,
    options: { startDate?: string; endDate?: string },
  ): Promise<ExpenseSummaryReport> {
    const cooperativeName = await this.getCooperativeName(cooperativeId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const dateFilter = this.getDateFilter(options.startDate, options.endDate);

    const expenseWhere: any = { cooperativeId };
    if (dateFilter) expenseWhere.createdAt = dateFilter;

    const expenses = await this.prisma.expense.findMany({
      where: expenseWhere,
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const approvedExpenses = expenses.filter(e => e.status === 'approved');
    const totalExpenses = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);

    // By category
    const byCategoryMap = new Map<string, { category: any; amount: number; count: number }>();
    for (const expense of approvedExpenses) {
      const catId = expense.categoryId || 'uncategorized';
      if (!byCategoryMap.has(catId)) {
        byCategoryMap.set(catId, {
          category: expense.category,
          amount: 0,
          count: 0,
        });
      }
      const entry = byCategoryMap.get(catId)!;
      entry.amount += expense.amount;
      entry.count += 1;
    }

    // By month
    const byMonthMap = new Map<string, { amount: number; count: number }>();
    for (const expense of approvedExpenses) {
      const month = new Date(expense.createdAt).toISOString().slice(0, 7);
      if (!byMonthMap.has(month)) {
        byMonthMap.set(month, { amount: 0, count: 0 });
      }
      const entry = byMonthMap.get(month)!;
      entry.amount += expense.amount;
      entry.count += 1;
    }

    return {
      metadata: this.createMetadata(
        'expense_summary',
        cooperativeId,
        cooperativeName,
        user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        options.startDate,
        options.endDate,
      ),
      summary: {
        totalExpenses,
        approvedExpenses: approvedExpenses.length,
        pendingExpenses: expenses.filter(e => e.status === 'pending').length,
        rejectedExpenses: expenses.filter(e => e.status === 'rejected').length,
        expenseCount: expenses.length,
      },
      byCategory: Array.from(byCategoryMap.entries()).map(([categoryId, data]) => ({
        categoryId,
        categoryName: data.category?.name || 'Uncategorized',
        totalAmount: data.amount,
        expenseCount: data.count,
        percentage: totalExpenses > 0 ? Math.round((data.amount / totalExpenses) * 10000) / 100 : 0,
      })),
      byMonth: Array.from(byMonthMap.entries())
        .map(([month, data]) => ({ month, totalAmount: data.amount, expenseCount: data.count }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      recentExpenses: expenses.slice(0, 20).map(e => ({
        expenseId: e.id,
        title: e.title,
        category: e.category?.name || 'Uncategorized',
        amount: e.amount,
        status: e.status,
        date: e.createdAt.toISOString(),
        createdBy: e.createdBy,
      })),
    };
  }

  async generateFinancialStatement(
    cooperativeId: string,
    userId: string,
    options: { startDate?: string; endDate?: string },
  ): Promise<FinancialStatementReport> {
    const cooperativeName = await this.getCooperativeName(cooperativeId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const dateFilter = this.getDateFilter(options.startDate, options.endDate);

    // Income calculations
    const contributionWhere: any = {
      status: 'approved',
      subscription: { plan: { cooperativeId } },
    };
    if (dateFilter) contributionWhere.approvedAt = dateFilter;

    const contributions = await this.prisma.contributionPayment.aggregate({
      where: contributionWhere,
      _sum: { amount: true },
    });

    const loanWhere: any = {
      cooperativeId,
      status: { in: ['disbursed', 'repaying', 'completed'] },
    };
    if (dateFilter) loanWhere.disbursedAt = dateFilter;

    const loans = await this.prisma.loan.findMany({
      where: loanWhere,
      select: {
        interestAmount: true,
        applicationFee: true,
        amountDisbursed: true,
        repaymentSchedules: {
          where: { status: 'paid' },
          select: { paidAmount: true },
        },
      },
    });

    const loanInterest = loans.reduce((sum, l) => sum + l.interestAmount, 0);
    const applicationFees = loans.reduce((sum, l) => sum + (l.applicationFee || 0), 0);
    const totalDisbursed = loans.reduce((sum, l) => sum + l.amountDisbursed, 0);
    const totalRepaid = loans.reduce(
      (sum, l) => sum + l.repaymentSchedules.reduce((s, r) => s + r.paidAmount, 0),
      0
    );

    // Expense calculations
    const expenseWhere: any = { cooperativeId, status: 'approved' };
    if (dateFilter) expenseWhere.createdAt = dateFilter;

    const expenses = await this.prisma.expense.findMany({
      where: expenseWhere,
      include: { category: true },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const expenseBreakdown: Record<string, number> = {};
    for (const expense of expenses) {
      const cat = expense.category?.name || 'Uncategorized';
      expenseBreakdown[cat] = (expenseBreakdown[cat] || 0) + expense.amount;
    }

    // Outstanding loans
    const outstandingLoans = await this.prisma.loan.aggregate({
      where: {
        cooperativeId,
        status: { in: ['disbursed', 'repaying'] },
      },
      _sum: { totalRepayment: true },
    });

    const outstandingRepaid = await this.prisma.loanRepaymentSchedule.aggregate({
      where: {
        loan: {
          cooperativeId,
          status: { in: ['disbursed', 'repaying'] },
        },
        status: 'paid',
      },
      _sum: { paidAmount: true },
    });

    const outstandingLoanAmount = (outstandingLoans._sum?.totalRepayment || 0) - (outstandingRepaid._sum?.paidAmount || 0);

    // Member savings (total contributions minus disbursements)
    const allContributions = await this.prisma.contributionPayment.aggregate({
      where: { status: 'approved', subscription: { plan: { cooperativeId } } },
      _sum: { amount: true },
    });

    const allDisbursements = await this.prisma.loan.aggregate({
      where: { cooperativeId, status: { in: ['disbursed', 'repaying', 'completed'] } },
      _sum: { amountDisbursed: true },
    });

    const memberSavings = (allContributions._sum.amount || 0) - (allDisbursements._sum.amountDisbursed || 0);
    const totalIncome = (contributions._sum.amount || 0) + loanInterest + applicationFees;
    const netIncome = totalIncome - totalExpenses;

    const cashOnHand = memberSavings + totalRepaid - totalDisbursed - totalExpenses;

    return {
      metadata: this.createMetadata(
        'financial_statement',
        cooperativeId,
        cooperativeName,
        user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        options.startDate,
        options.endDate,
      ),
      incomeStatement: {
        totalIncome,
        incomeBreakdown: {
          contributions: contributions._sum.amount || 0,
          loanInterest,
          applicationFees,
          penalties: 0,
          other: 0,
        },
        totalExpenses,
        expenseBreakdown,
        netIncome,
      },
      balanceSheet: {
        assets: {
          cashOnHand: Math.max(0, cashOnHand),
          outstandingLoans: outstandingLoanAmount,
          totalAssets: Math.max(0, cashOnHand) + outstandingLoanAmount,
        },
        liabilities: {
          memberSavings: Math.max(0, memberSavings),
          totalLiabilities: Math.max(0, memberSavings),
        },
        equity: Math.max(0, cashOnHand) + outstandingLoanAmount - Math.max(0, memberSavings),
      },
      cashFlow: {
        openingBalance: 0,
        inflows: {
          contributions: contributions._sum.amount || 0,
          loanRepayments: totalRepaid,
          fees: applicationFees,
        },
        outflows: {
          loanDisbursements: totalDisbursed,
          expenses: totalExpenses,
        },
        netCashFlow: (contributions._sum.amount || 0) + totalRepaid + applicationFees - totalDisbursed - totalExpenses,
        closingBalance: Math.max(0, cashOnHand),
      },
    };
  }

  async generateMemberActivity(
    cooperativeId: string,
    userId: string,
    options: { startDate?: string; endDate?: string },
  ): Promise<MemberActivityReport> {
    const cooperativeName = await this.getCooperativeName(cooperativeId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const dateFilter = this.getDateFilter(options.startDate, options.endDate);

    const members = await this.prisma.member.findMany({
      where: { cooperativeId, status: 'active' },
      include: {
        user: { select: { firstName: true, lastName: true } },
        contributionPayments: {
          where: { status: 'approved' },
          orderBy: { createdAt: 'desc' },
        },
        loans: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const memberDetails = members.map(member => {
      const name = member.user
        ? `${member.user.firstName} ${member.user.lastName}`
        : `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown';

      const lastPayment = member.contributionPayments[0];
      const lastLoan = member.loans[0];
      const lastActivityDate = [lastPayment?.createdAt, lastLoan?.createdAt]
        .filter(Boolean)
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];

      const isActive = lastActivityDate && new Date(lastActivityDate) > thirtyDaysAgo;

      return {
        memberId: member.id,
        memberName: name,
        joinedAt: member.joinedAt.toISOString(),
        lastActivityDate: lastActivityDate?.toISOString() || member.joinedAt.toISOString(),
        contributionCount: member.contributionPayments.length,
        totalContributed: member.contributionPayments.reduce((sum, p) => sum + p.amount, 0),
        loanCount: member.loans.length,
        status: isActive ? 'active' as const : 'inactive' as const,
      };
    });

    // Calculate activity by month
    const startOfYear = new Date();
    startOfYear.setMonth(0, 1);
    startOfYear.setHours(0, 0, 0, 0);

    const membersByMonth = await this.prisma.member.groupBy({
      by: ['joinedAt'],
      where: {
        cooperativeId,
        status: 'active',
        joinedAt: { gte: startOfYear },
      },
    });

    const activityByMonthMap = new Map<string, { newMembers: number; transactions: number }>();
    for (const m of membersByMonth) {
      const month = new Date(m.joinedAt).toISOString().slice(0, 7);
      if (!activityByMonthMap.has(month)) {
        activityByMonthMap.set(month, { newMembers: 0, transactions: 0 });
      }
      activityByMonthMap.get(month)!.newMembers += 1;
    }

    const activeMembers = memberDetails.filter(m => m.status === 'active').length;
    const newMembersThisMonth = members.filter(m => {
      const joinDate = new Date(m.joinedAt);
      const now = new Date();
      return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
    }).length;

    return {
      metadata: this.createMetadata(
        'member_activity',
        cooperativeId,
        cooperativeName,
        user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        options.startDate,
        options.endDate,
      ),
      summary: {
        totalMembers: members.length,
        activeMembers,
        inactiveMembers: members.length - activeMembers,
        newMembers: newMembersThisMonth,
      },
      memberDetails: memberDetails.sort((a, b) => 
        new Date(b.lastActivityDate).getTime() - new Date(a.lastActivityDate).getTime()
      ),
      activityByMonth: Array.from(activityByMonthMap.entries())
        .map(([month, data]) => ({
          month,
          newMembers: data.newMembers,
          activeMembers: 0, // Would need more complex calculation
          totalTransactions: data.transactions,
        }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    };
  }

  // CSV Export helpers
  convertToCSV(data: any[], headers: string[]): string {
    const rows = [headers.join(',')];
    for (const item of data) {
      const row = headers.map(header => {
        const value = item[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      });
      rows.push(row.join(','));
    }
    return rows.join('\n');
  }

  /**
   * Export report to CSV or Excel format
   */
  async exportReport(
    cooperativeId: string,
    userId: string,
    reportType: ReportType,
    format: 'csv' | 'excel',
    options: {
      startDate?: string;
      endDate?: string;
      memberId?: string;
      planId?: string;
    } = {},
  ): Promise<{ content: string; filename: string; mimeType: string }> {
    // Generate the report data first
    const report = await this.generateReport(cooperativeId, userId, reportType, options);

    // Get column definitions for this report type
    const columns = REPORT_COLUMNS[reportType] || [];

    // Flatten the report data into exportable rows
    const flatData = flattenReportData(reportType, report);

    // Generate filename
    const cooperativeName = await this.getCooperativeName(cooperativeId);
    const dateStr = new Date().toISOString().split('T')[0];
    const safeCoopName = cooperativeName.replace(/[^a-zA-Z0-9]/g, '_');
    const baseFilename = `${safeCoopName}_${reportType}_${dateStr}`;

    if (format === 'csv') {
      return {
        content: generateCsv(flatData, columns),
        filename: `${baseFilename}.csv`,
        mimeType: 'text/csv',
      };
    } else {
      // Excel XML format
      const sheetName = reportType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        content: generateExcelXml(flatData, columns, sheetName),
        filename: `${baseFilename}.xls`,
        mimeType: 'application/vnd.ms-excel',
      };
    }
  }

  getAvailableReportTypes() {
    return [
      {
        type: 'contribution_summary',
        name: 'Contribution Summary',
        description: 'Overview of all contributions by plan, month, and top contributors',
        icon: 'DollarSign',
      },
      {
        type: 'member_balances',
        name: 'Member Balances',
        description: 'Current balance and financial summary for all members',
        icon: 'Users',
      },
      {
        type: 'loan_summary',
        name: 'Loan Summary',
        description: 'Overview of loans issued, repayments, and performance metrics',
        icon: 'CreditCard',
      },
      {
        type: 'loan_repayment',
        name: 'Loan Repayment Status',
        description: 'Overdue and upcoming loan repayments',
        icon: 'Calendar',
      },
      {
        type: 'expense_summary',
        name: 'Expense Summary',
        description: 'Breakdown of expenses by category and month',
        icon: 'ShoppingCart',
      },
      {
        type: 'financial_statement',
        name: 'Financial Statement',
        description: 'Income statement, balance sheet, and cash flow',
        icon: 'FileText',
      },
      {
        type: 'member_activity',
        name: 'Member Activity',
        description: 'Member engagement and activity metrics',
        icon: 'Activity',
      },
    ];
  }
}
