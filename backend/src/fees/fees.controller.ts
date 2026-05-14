import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeesService } from './fees.service';
import {
  ApproveFeePaymentDto,
  CreateFeeDto,
  ListFeePaymentsDto,
  RecordFeePaymentDto,
  UpdateFeeDto,
} from './dto';

@Controller('fees')
@UseGuards(AuthGuard('jwt'))
export class FeesController {
  constructor(private readonly service: FeesService) {}

  @Post('cooperatives/:cooperativeId')
  async createFee(
    @Param('cooperativeId') cooperativeId: string,
    @Body() dto: CreateFeeDto,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.createFee(cooperativeId, dto, req.user.id);
      return { success: true, message: 'Fee created successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to create fee', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('cooperatives/:cooperativeId')
  async getFees(@Param('cooperativeId') cooperativeId: string, @Request() req: any) {
    try {
      const data = await this.service.getFees(cooperativeId, req.user.id);
      return { success: true, message: 'Fees retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to retrieve fees', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':feeId')
  async updateFee(@Param('feeId') feeId: string, @Body() dto: UpdateFeeDto, @Request() req: any) {
    try {
      const data = await this.service.updateFee(feeId, dto, req.user.id);
      return { success: true, message: 'Fee updated successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to update fee', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':feeId/payments')
  async recordFeePayment(
    @Param('feeId') feeId: string,
    @Body() dto: RecordFeePaymentDto,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.recordFeePayment(feeId, dto, req.user.id);
      return { success: true, message: 'Fee payment recorded successfully. Awaiting approval.', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to record fee payment', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':feeId/payments')
  async getFeePayments(
    @Param('feeId') feeId: string,
    @Query() query: ListFeePaymentsDto,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.getFeePayments(feeId, query, req.user.id);
      return { success: true, message: 'Fee payments retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to retrieve fee payments', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('cooperatives/:cooperativeId/pending-payments')
  async getPendingPayments(@Param('cooperativeId') cooperativeId: string, @Request() req: any) {
    try {
      const data = await this.service.getPendingPayments(cooperativeId, req.user.id);
      return { success: true, message: 'Pending fee payments retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to retrieve pending fee payments', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('cooperatives/:cooperativeId/my-payments')
  async getMyPayments(@Param('cooperativeId') cooperativeId: string, @Request() req: any) {
    try {
      const data = await this.service.getMyPayments(cooperativeId, req.user.id);
      return { success: true, message: 'My fee payments retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to retrieve fee payments', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch('payments/:paymentId/approve')
  async approvePayment(
    @Param('paymentId') paymentId: string,
    @Body() dto: ApproveFeePaymentDto,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.approveFeePayment(paymentId, dto, req.user.id);
      return { success: true, message: 'Fee payment updated successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to update fee payment', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
