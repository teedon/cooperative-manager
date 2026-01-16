import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CollectionAuditService } from '../services/collection-audit.service';

/**
 * Controller for collection audit and statistics endpoints.
 * Provides comprehensive reporting and analytics for daily collections.
 * 
 * @security JWT Bearer token required
 */
@Controller('organizations/:organizationId/collections/audit')
@UseGuards(AuthGuard('jwt'))
export class CollectionAuditController {
  constructor(private readonly auditService: CollectionAuditService) {}

  /**
   * Get comprehensive organization-wide collection statistics.
   * 
   * @route GET /organizations/:organizationId/collections/audit/organization-stats
   * @param organizationId - Organization ID
   * @param startDate - Optional filter start date (ISO 8601)
   * @param endDate - Optional filter end date (ISO 8601)
   * @returns Organization statistics including counts, amounts, and averages
   * 
   * @example
   * GET /organizations/org123/collections/audit/organization-stats?startDate=2026-01-01&endDate=2026-01-31
   * Response:
   * {
   *   "totalCollections": 150,
   *   "draftCount": 5,
   *   "submittedCount": 10,
   *   "approvedCount": 130,
   *   "rejectedCount": 5,
   *   "totalAmount": 5000000,
   *   "averageAmount": 33333,
   *   "averageTransactions": 12.5
   * }
   */
  @Get('organization-stats')
  @HttpCode(HttpStatus.OK)
  async getOrganizationStats(
    @Param('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.auditService.getOrganizationStats(organizationId, start, end);
  }

  /**
   * Get staff performance statistics.
   * 
   * @route GET /organizations/:organizationId/collections/audit/staff-stats/:staffId
   * @param organizationId - Organization ID
   * @param staffId - Staff member ID
   * @param startDate - Optional filter start date (ISO 8601)
   * @param endDate - Optional filter end date (ISO 8601)
   * @returns Staff performance metrics
   * 
   * @example
   * GET /organizations/org123/collections/audit/staff-stats/staff456?startDate=2026-01-01
   * Response:
   * {
   *   "staffId": "staff456",
   *   "totalCollections": 25,
   *   "approvedCount": 23,
   *   "rejectedCount": 2,
   *   "approvalRate": 92.0,
   *   "totalAmount": 850000,
   *   "averageAmount": 34000
   * }
   */
  @Get('staff-stats/:staffId')
  @HttpCode(HttpStatus.OK)
  async getStaffStats(
    @Param('organizationId') organizationId: string,
    @Param('staffId') staffId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.auditService.getStaffStats(staffId, start, end);
  }

  /**
   * Get transaction type breakdown statistics.
   * 
   * @route GET /organizations/:organizationId/collections/audit/transaction-types
   * @param organizationId - Organization ID
   * @param startDate - Optional filter start date (ISO 8601)
   * @param endDate - Optional filter end date (ISO 8601)
   * @returns Array of transaction types with counts and amounts
   * 
   * @example
   * GET /organizations/org123/collections/audit/transaction-types
   * Response:
   * [
   *   { "type": "contribution", "count": 500, "totalAmount": 2500000 },
   *   { "type": "loan_repayment", "count": 150, "totalAmount": 1800000 },
   *   { "type": "ajo_payment", "count": 80, "totalAmount": 400000 }
   * ]
   */
  @Get('transaction-types')
  @HttpCode(HttpStatus.OK)
  async getTransactionTypeStats(
    @Param('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.auditService.getTransactionTypeStats(organizationId, start, end);
  }

  /**
   * Get rejection analysis statistics.
   * 
   * @route GET /organizations/:organizationId/collections/audit/rejections
   * @param organizationId - Organization ID
   * @param startDate - Optional filter start date (ISO 8601)
   * @param endDate - Optional filter end date (ISO 8601)
   * @returns Rejection statistics with top reasons
   * 
   * @example
   * GET /organizations/org123/collections/audit/rejections
   * Response:
   * {
   *   "totalRejections": 15,
   *   "topReasons": [
   *     { "reason": "Incomplete information", "count": 6 },
   *     { "reason": "Duplicate transactions", "count": 4 },
   *     { "reason": "Invalid amounts", "count": 3 },
   *     { "reason": "Other", "count": 2 }
   *   ]
   * }
   */
  @Get('rejections')
  @HttpCode(HttpStatus.OK)
  async getRejectionStats(
    @Param('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.auditService.getRejectionStats(organizationId, start, end);
  }

  /**
   * Get approval latency statistics.
   * Shows how long it takes for collections to be approved after submission.
   * 
   * @route GET /organizations/:organizationId/collections/audit/approval-latency
   * @param organizationId - Organization ID
   * @param startDate - Optional filter start date (ISO 8601)
   * @param endDate - Optional filter end date (ISO 8601)
   * @returns Approval time statistics in hours
   * 
   * @example
   * GET /organizations/org123/collections/audit/approval-latency
   * Response:
   * {
   *   "averageHours": 18.5,
   *   "medianHours": 12.0,
   *   "minHours": 2.5,
   *   "maxHours": 72.0,
   *   "totalApproved": 130
   * }
   */
  @Get('approval-latency')
  @HttpCode(HttpStatus.OK)
  async getApprovalLatencyStats(
    @Param('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.auditService.getApprovalLatencyStats(organizationId, start, end);
  }

  /**
   * Get daily trend data for collections.
   * Useful for charts and visualizations.
   * 
   * @route GET /organizations/:organizationId/collections/audit/daily-trends
   * @param organizationId - Organization ID
   * @param days - Number of days to retrieve (default: 30, max: 90)
   * @returns Array of daily statistics
   * 
   * @example
   * GET /organizations/org123/collections/audit/daily-trends?days=7
   * Response:
   * [
   *   { "date": "2026-01-15", "collections": 12, "amount": 450000, "transactions": 48 },
   *   { "date": "2026-01-14", "collections": 10, "amount": 380000, "transactions": 42 },
   *   { "date": "2026-01-13", "collections": 15, "amount": 520000, "transactions": 58 },
   *   ...
   * ]
   */
  @Get('daily-trends')
  @HttpCode(HttpStatus.OK)
  async getDailyTrends(
    @Param('organizationId') organizationId: string,
    @Query('days') days?: number,
  ) {
    const daysCount = days ? Math.min(Math.max(parseInt(days.toString(), 10), 1), 90) : 30;
    
    return this.auditService.getDailyTrends(organizationId, daysCount);
  }

  /**
   * Get all available statistics at once (dashboard endpoint).
   * Combines organization stats, transaction types, and recent trends.
   * 
   * @route GET /organizations/:organizationId/collections/audit/dashboard
   * @param organizationId - Organization ID
   * @param startDate - Optional filter start date (ISO 8601)
   * @param endDate - Optional filter end date (ISO 8601)
   * @returns Combined dashboard data
   * 
   * @example
   * GET /organizations/org123/collections/audit/dashboard
   * Response:
   * {
   *   "organizationStats": { ... },
   *   "transactionTypes": [ ... ],
   *   "rejections": { ... },
   *   "approvalLatency": { ... },
   *   "dailyTrends": [ ... ]
   * }
   */
  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  async getDashboard(
    @Param('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const [
      organizationStats,
      transactionTypes,
      rejections,
      approvalLatency,
      dailyTrends,
    ] = await Promise.all([
      this.auditService.getOrganizationStats(organizationId, start, end),
      this.auditService.getTransactionTypeStats(organizationId, start, end),
      this.auditService.getRejectionStats(organizationId, start, end),
      this.auditService.getApprovalLatencyStats(organizationId, start, end),
      this.auditService.getDailyTrends(organizationId, 30),
    ]);

    return {
      organizationStats,
      transactionTypes,
      rejections,
      approvalLatency,
      dailyTrends,
    };
  }
}
