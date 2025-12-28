import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  Request,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { GenerateReportDto, ReportType, ExportFormat } from './dto/report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('types')
  async getReportTypes() {
    const data = this.reportsService.getAvailableReportTypes();
    return { success: true, message: 'Report types retrieved successfully', data };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('cooperatives/:cooperativeId/generate')
  async generateReport(
    @Param('cooperativeId') cooperativeId: string,
    @Query('reportType') reportType: ReportType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('memberId') memberId?: string,
    @Query('planId') planId?: string,
    @Request() req?: any,
  ) {
    try {
      const user = req.user;
      const data = await this.reportsService.generateReport(
        cooperativeId,
        user.id,
        reportType,
        { startDate, endDate, memberId, planId },
      );
      return { success: true, message: 'Report generated successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to generate report', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('cooperatives/:cooperativeId/export/pdf')
  async exportReportPDF(
    @Param('cooperativeId') cooperativeId: string,
    @Query('reportType') reportType: ReportType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('memberId') memberId?: string,
    @Query('planId') planId?: string,
    @Request() req?: any,
    @Res() res?: Response,
  ) {
    try {
      const user = req.user;
      const report = await this.reportsService.generateReport(
        cooperativeId,
        user.id,
        reportType,
        { startDate, endDate, memberId, planId },
      );

      const filename = `${reportType}_report_${new Date().toISOString().slice(0, 10)}.pdf`;
      const pdfBuffer = await this.reportsService.generatePDF(report, reportType);

      res!.setHeader('Content-Type', 'application/pdf');
      res!.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res!.send(pdfBuffer);
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to export report', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('cooperatives/:cooperativeId/export/csv')
  async exportReportCSV(
    @Param('cooperativeId') cooperativeId: string,
    @Query('reportType') reportType: ReportType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('memberId') memberId?: string,
    @Query('planId') planId?: string,
    @Request() req?: any,
    @Res() res?: Response,
  ) {
    try {
      const user = req.user;
      const report = await this.reportsService.generateReport(
        cooperativeId,
        user.id,
        reportType,
        { startDate, endDate, memberId, planId },
      );

      let csvData = '';
      let filename = `${reportType}_report_${new Date().toISOString().slice(0, 10)}.csv`;

      switch (reportType) {
        case 'contribution_summary':
          csvData = this.formatContributionSummaryCSV(report);
          break;
        case 'member_balances':
          csvData = this.formatMemberBalancesCSV(report);
          break;
        case 'loan_summary':
          csvData = this.formatLoanSummaryCSV(report);
          break;
        case 'loan_repayment':
          csvData = this.formatLoanRepaymentCSV(report);
          break;
        case 'expense_summary':
          csvData = this.formatExpenseSummaryCSV(report);
          break;
        case 'financial_statement':
          csvData = this.formatFinancialStatementCSV(report);
          break;
        case 'member_activity':
          csvData = this.formatMemberActivityCSV(report);
          break;
        default:
          throw new Error('Unknown report type for CSV export');
      }

      res!.setHeader('Content-Type', 'text/csv');
      res!.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res!.send(csvData);
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to export report', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // CSV formatting helpers
  private formatContributionSummaryCSV(report: any): string {
    const lines: string[] = [];
    
    // Header info
    lines.push(`Contribution Summary Report`);
    lines.push(`Cooperative: ${report.metadata.cooperativeName}`);
    lines.push(`Generated: ${report.metadata.generatedAt}`);
    lines.push('');

    // Summary
    lines.push('SUMMARY');
    lines.push(`Total Contributions,${report.summary.totalContributions}`);
    lines.push(`Total Payments,${report.summary.totalPayments}`);
    lines.push(`Approved Payments,${report.summary.approvedPayments}`);
    lines.push(`Pending Payments,${report.summary.pendingPayments}`);
    lines.push(`Unique Contributors,${report.summary.uniqueContributors}`);
    lines.push('');

    // By Plan
    lines.push('BY PLAN');
    lines.push('Plan Name,Category,Total Amount,Payment Count,Subscribers');
    for (const plan of report.byPlan) {
      lines.push(`"${plan.planName}",${plan.category},${plan.totalAmount},${plan.paymentCount},${plan.subscriberCount}`);
    }
    lines.push('');

    // By Month
    lines.push('BY MONTH');
    lines.push('Month,Total Amount,Payment Count');
    for (const month of report.byMonth) {
      lines.push(`${month.month},${month.totalAmount},${month.paymentCount}`);
    }
    lines.push('');

    // Top Contributors
    lines.push('TOP CONTRIBUTORS');
    lines.push('Member Name,Total Amount,Payment Count');
    for (const contributor of report.topContributors) {
      lines.push(`"${contributor.memberName}",${contributor.totalAmount},${contributor.paymentCount}`);
    }

    return lines.join('\n');
  }

  private formatMemberBalancesCSV(report: any): string {
    const lines: string[] = [];
    
    lines.push(`Member Balances Report`);
    lines.push(`Cooperative: ${report.metadata.cooperativeName}`);
    lines.push(`Generated: ${report.metadata.generatedAt}`);
    lines.push('');

    lines.push('SUMMARY');
    lines.push(`Total Members,${report.summary.totalMembers}`);
    lines.push(`Total Balance,${report.summary.totalBalance}`);
    lines.push(`Average Balance,${report.summary.averageBalance.toFixed(2)}`);
    lines.push(`Total Contributions,${report.summary.totalContributions}`);
    lines.push(`Total Loans,${report.summary.totalLoans}`);
    lines.push('');

    lines.push('MEMBER DETAILS');
    lines.push('Member Name,Member Code,Offline Member,Joined At,Total Contributions,Total Loans,Loan Repayments,Current Balance');
    for (const member of report.members) {
      lines.push(`"${member.memberName}","${member.memberCode || ''}",${member.isOfflineMember ? 'Yes' : 'No'},${member.joinedAt.slice(0, 10)},${member.totalContributions},${member.totalLoansTaken},${member.totalLoanRepayments},${member.currentBalance}`);
    }

    return lines.join('\n');
  }

  private formatLoanSummaryCSV(report: any): string {
    const lines: string[] = [];
    
    lines.push(`Loan Summary Report`);
    lines.push(`Cooperative: ${report.metadata.cooperativeName}`);
    lines.push(`Generated: ${report.metadata.generatedAt}`);
    lines.push('');

    lines.push('SUMMARY');
    lines.push(`Total Loans Issued,${report.summary.totalLoansIssued}`);
    lines.push(`Total Amount Disbursed,${report.summary.totalAmountDisbursed}`);
    lines.push(`Total Interest Earned,${report.summary.totalInterestEarned}`);
    lines.push(`Total Application Fees,${report.summary.totalApplicationFees}`);
    lines.push(`Active Loans,${report.summary.activeLoans}`);
    lines.push(`Completed Loans,${report.summary.completedLoans}`);
    lines.push(`Pending Loans,${report.summary.pendingLoans}`);
    lines.push(`Repayment Rate,${report.summary.repaymentRate}%`);
    lines.push('');

    lines.push('BY LOAN TYPE');
    lines.push('Loan Type,Count,Total Disbursed,Total Repaid,Interest Earned');
    for (const type of report.byLoanType) {
      lines.push(`"${type.loanTypeName}",${type.loanCount},${type.totalDisbursed},${type.totalRepaid},${type.interestEarned}`);
    }
    lines.push('');

    lines.push('TOP BORROWERS');
    lines.push('Member Name,Total Borrowed,Total Repaid,Active Loans');
    for (const borrower of report.topBorrowers) {
      lines.push(`"${borrower.memberName}",${borrower.totalBorrowed},${borrower.totalRepaid},${borrower.activeLoans}`);
    }

    return lines.join('\n');
  }

  private formatLoanRepaymentCSV(report: any): string {
    const lines: string[] = [];
    
    lines.push(`Loan Repayment Status Report`);
    lines.push(`Cooperative: ${report.metadata.cooperativeName}`);
    lines.push(`Generated: ${report.metadata.generatedAt}`);
    lines.push('');

    lines.push('SUMMARY');
    lines.push(`Total Expected,${report.summary.totalExpectedRepayments}`);
    lines.push(`Total Actual,${report.summary.totalActualRepayments}`);
    lines.push(`Overdue Amount,${report.summary.overdueAmount}`);
    lines.push(`Repayment Percentage,${report.summary.repaymentPercentage}%`);
    lines.push('');

    lines.push('OVERDUE REPAYMENTS');
    lines.push('Member Name,Due Date,Amount Due,Days Overdue');
    for (const item of report.overdueRepayments) {
      lines.push(`"${item.memberName}",${item.dueDate.slice(0, 10)},${item.amountDue},${item.daysOverdue}`);
    }
    lines.push('');

    lines.push('UPCOMING REPAYMENTS');
    lines.push('Member Name,Due Date,Amount Due');
    for (const item of report.upcomingRepayments) {
      lines.push(`"${item.memberName}",${item.dueDate.slice(0, 10)},${item.amountDue}`);
    }

    return lines.join('\n');
  }

  private formatExpenseSummaryCSV(report: any): string {
    const lines: string[] = [];
    
    lines.push(`Expense Summary Report`);
    lines.push(`Cooperative: ${report.metadata.cooperativeName}`);
    lines.push(`Generated: ${report.metadata.generatedAt}`);
    lines.push('');

    lines.push('SUMMARY');
    lines.push(`Total Expenses,${report.summary.totalExpenses}`);
    lines.push(`Approved,${report.summary.approvedExpenses}`);
    lines.push(`Pending,${report.summary.pendingExpenses}`);
    lines.push(`Rejected,${report.summary.rejectedExpenses}`);
    lines.push('');

    lines.push('BY CATEGORY');
    lines.push('Category,Total Amount,Count,Percentage');
    for (const cat of report.byCategory) {
      lines.push(`"${cat.categoryName}",${cat.totalAmount},${cat.expenseCount},${cat.percentage}%`);
    }
    lines.push('');

    lines.push('RECENT EXPENSES');
    lines.push('Title,Category,Amount,Status,Date,Created By');
    for (const exp of report.recentExpenses) {
      lines.push(`"${exp.title}","${exp.category}",${exp.amount},${exp.status},${exp.date.slice(0, 10)},"${exp.createdBy}"`);
    }

    return lines.join('\n');
  }

  private formatFinancialStatementCSV(report: any): string {
    const lines: string[] = [];
    
    lines.push(`Financial Statement Report`);
    lines.push(`Cooperative: ${report.metadata.cooperativeName}`);
    lines.push(`Generated: ${report.metadata.generatedAt}`);
    lines.push('');

    lines.push('INCOME STATEMENT');
    lines.push('');
    lines.push('Income');
    lines.push(`  Contributions,${report.incomeStatement.incomeBreakdown.contributions}`);
    lines.push(`  Loan Interest,${report.incomeStatement.incomeBreakdown.loanInterest}`);
    lines.push(`  Application Fees,${report.incomeStatement.incomeBreakdown.applicationFees}`);
    lines.push(`Total Income,${report.incomeStatement.totalIncome}`);
    lines.push('');
    lines.push('Expenses');
    for (const [category, amount] of Object.entries(report.incomeStatement.expenseBreakdown)) {
      lines.push(`  ${category},${amount}`);
    }
    lines.push(`Total Expenses,${report.incomeStatement.totalExpenses}`);
    lines.push('');
    lines.push(`Net Income,${report.incomeStatement.netIncome}`);
    lines.push('');

    lines.push('BALANCE SHEET');
    lines.push('');
    lines.push('Assets');
    lines.push(`  Cash on Hand,${report.balanceSheet.assets.cashOnHand}`);
    lines.push(`  Outstanding Loans,${report.balanceSheet.assets.outstandingLoans}`);
    lines.push(`Total Assets,${report.balanceSheet.assets.totalAssets}`);
    lines.push('');
    lines.push('Liabilities');
    lines.push(`  Member Savings,${report.balanceSheet.liabilities.memberSavings}`);
    lines.push(`Total Liabilities,${report.balanceSheet.liabilities.totalLiabilities}`);
    lines.push('');
    lines.push(`Equity,${report.balanceSheet.equity}`);
    lines.push('');

    lines.push('CASH FLOW');
    lines.push('');
    lines.push('Inflows');
    lines.push(`  Contributions,${report.cashFlow.inflows.contributions}`);
    lines.push(`  Loan Repayments,${report.cashFlow.inflows.loanRepayments}`);
    lines.push(`  Fees,${report.cashFlow.inflows.fees}`);
    lines.push('');
    lines.push('Outflows');
    lines.push(`  Loan Disbursements,${report.cashFlow.outflows.loanDisbursements}`);
    lines.push(`  Expenses,${report.cashFlow.outflows.expenses}`);
    lines.push('');
    lines.push(`Net Cash Flow,${report.cashFlow.netCashFlow}`);
    lines.push(`Closing Balance,${report.cashFlow.closingBalance}`);

    return lines.join('\n');
  }

  private formatMemberActivityCSV(report: any): string {
    const lines: string[] = [];
    
    lines.push(`Member Activity Report`);
    lines.push(`Cooperative: ${report.metadata.cooperativeName}`);
    lines.push(`Generated: ${report.metadata.generatedAt}`);
    lines.push('');

    lines.push('SUMMARY');
    lines.push(`Total Members,${report.summary.totalMembers}`);
    lines.push(`Active Members,${report.summary.activeMembers}`);
    lines.push(`Inactive Members,${report.summary.inactiveMembers}`);
    lines.push(`New Members This Month,${report.summary.newMembers}`);
    lines.push('');

    lines.push('MEMBER DETAILS');
    lines.push('Member Name,Joined At,Last Activity,Contribution Count,Total Contributed,Loan Count,Status');
    for (const member of report.memberDetails) {
      lines.push(`"${member.memberName}",${member.joinedAt.slice(0, 10)},${member.lastActivityDate.slice(0, 10)},${member.contributionCount},${member.totalContributed},${member.loanCount},${member.status}`);
    }

    return lines.join('\n');
  }

  /**
   * Unified export endpoint that supports both CSV and Excel formats
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('cooperatives/:cooperativeId/export')
  async exportReport(
    @Param('cooperativeId') cooperativeId: string,
    @Query('reportType') reportType: ReportType,
    @Query('format') format: ExportFormat = 'csv',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('memberId') memberId?: string,
    @Query('planId') planId?: string,
    @Request() req?: any,
    @Res() res?: Response,
  ) {
    try {
      const user = req.user;
      const result = await this.reportsService.exportReport(
        cooperativeId,
        user.id,
        reportType,
        format,
        { startDate, endDate, memberId, planId },
      );

      res!.setHeader('Content-Type', result.mimeType);
      res!.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res!.send(result.content);
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to export report', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Export to Excel format
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('cooperatives/:cooperativeId/export/excel')
  async exportReportExcel(
    @Param('cooperativeId') cooperativeId: string,
    @Query('reportType') reportType: ReportType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('memberId') memberId?: string,
    @Query('planId') planId?: string,
    @Request() req?: any,
    @Res() res?: Response,
  ) {
    try {
      const user = req.user;
      const result = await this.reportsService.exportReport(
        cooperativeId,
        user.id,
        reportType,
        'excel',
        { startDate, endDate, memberId, planId },
      );

      res!.setHeader('Content-Type', result.mimeType);
      res!.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res!.send(result.content);
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to export report', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
