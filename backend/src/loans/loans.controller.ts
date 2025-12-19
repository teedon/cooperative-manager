import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoansService } from './loans.service';
import { CreateLoanTypeDto, UpdateLoanTypeDto } from './dto/loan-type.dto';
import { RequestLoanDto, InitiateLoanDto, ApproveLoanDto, RejectLoanDto, RecordRepaymentDto } from './dto/loan.dto';

@Controller()
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  // ==================== LOAN TYPES ====================

  @UseGuards(AuthGuard('jwt'))
  @Get('cooperatives/:cooperativeId/loan-types')
  async getLoanTypes(@Param('cooperativeId') cooperativeId: string, @Request() req: any) {
    try {
      const data = await this.loansService.getLoanTypes(cooperativeId, req.user.id);
      return { success: true, message: 'Loan types retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch loan types', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('cooperatives/:cooperativeId/loan-types/:loanTypeId')
  async getLoanType(
    @Param('cooperativeId') cooperativeId: string,
    @Param('loanTypeId') loanTypeId: string,
    @Request() req: any,
  ) {
    try {
      const data = await this.loansService.getLoanType(cooperativeId, loanTypeId, req.user.id);
      return { success: true, message: 'Loan type retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch loan type', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('cooperatives/:cooperativeId/loan-types')
  async createLoanType(
    @Param('cooperativeId') cooperativeId: string,
    @Body() dto: CreateLoanTypeDto,
    @Request() req: any,
  ) {
    try {
      const data = await this.loansService.createLoanType(cooperativeId, dto, req.user.id);
      return { success: true, message: 'Loan type created successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to create loan type', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('cooperatives/:cooperativeId/loan-types/:loanTypeId')
  async updateLoanType(
    @Param('cooperativeId') cooperativeId: string,
    @Param('loanTypeId') loanTypeId: string,
    @Body() dto: UpdateLoanTypeDto,
    @Request() req: any,
  ) {
    try {
      const data = await this.loansService.updateLoanType(cooperativeId, loanTypeId, dto, req.user.id);
      return { success: true, message: 'Loan type updated successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to update loan type', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('cooperatives/:cooperativeId/loan-types/:loanTypeId')
  async deleteLoanType(
    @Param('cooperativeId') cooperativeId: string,
    @Param('loanTypeId') loanTypeId: string,
    @Request() req: any,
  ) {
    try {
      const data = await this.loansService.deleteLoanType(cooperativeId, loanTypeId, req.user.id);
      return { success: true, message: 'Loan type deleted successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to delete loan type', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ==================== LOANS ====================

  @UseGuards(AuthGuard('jwt'))
  @Get('cooperatives/:cooperativeId/loans')
  async getLoans(@Param('cooperativeId') cooperativeId: string, @Request() req: any) {
    try {
      const data = await this.loansService.getLoans(cooperativeId, req.user.id);
      return { success: true, message: 'Loans retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch loans', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('cooperatives/:cooperativeId/loans/pending')
  async getPendingLoans(@Param('cooperativeId') cooperativeId: string, @Request() req: any) {
    try {
      const data = await this.loansService.getPendingLoans(cooperativeId, req.user.id);
      return { success: true, message: 'Pending loans retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch pending loans', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('cooperatives/:cooperativeId/loans/my-loans')
  async getMyLoans(@Param('cooperativeId') cooperativeId: string, @Request() req: any) {
    try {
      const data = await this.loansService.getMyLoans(cooperativeId, req.user.id);
      return { success: true, message: 'Your loans retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch your loans', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('cooperatives/:cooperativeId/loans')
  async requestLoan(
    @Param('cooperativeId') cooperativeId: string,
    @Body() dto: RequestLoanDto,
    @Request() req: any,
  ) {
    try {
      const data = await this.loansService.requestLoan(cooperativeId, dto, req.user.id);
      return { success: true, message: 'Loan request submitted successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to submit loan request', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('cooperatives/:cooperativeId/loans/initiate')
  async initiateLoan(
    @Param('cooperativeId') cooperativeId: string,
    @Body() dto: InitiateLoanDto,
    @Request() req: any,
  ) {
    try {
      const data = await this.loansService.initiateLoanForMember(cooperativeId, dto, req.user.id);
      return { success: true, message: 'Loan initiated successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to initiate loan', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('loans/:loanId')
  async getLoan(@Param('loanId') loanId: string, @Request() req: any) {
    try {
      const data = await this.loansService.getLoan(loanId, req.user.id);
      return { success: true, message: 'Loan retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch loan', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('loans/:loanId/approve')
  async approveLoan(
    @Param('loanId') loanId: string,
    @Body() dto: ApproveLoanDto,
    @Request() req: any,
  ) {
    try {
      const data = await this.loansService.approveLoan(loanId, dto, req.user.id);
      return { success: true, message: 'Loan approved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to approve loan', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('loans/:loanId/reject')
  async rejectLoan(
    @Param('loanId') loanId: string,
    @Body() dto: RejectLoanDto,
    @Request() req: any,
  ) {
    try {
      const data = await this.loansService.rejectLoan(loanId, dto, req.user.id);
      return { success: true, message: 'Loan rejected successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to reject loan', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('loans/:loanId/disburse')
  async disburseLoan(@Param('loanId') loanId: string, @Request() req: any) {
    try {
      const data = await this.loansService.disburseLoan(loanId, req.user.id);
      return { success: true, message: 'Loan disbursed successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to disburse loan', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('loans/:loanId/repayments')
  async getRepaymentSchedules(@Param('loanId') loanId: string, @Request() req: any) {
    try {
      const data = await this.loansService.getRepaymentSchedules(loanId, req.user.id);
      return { success: true, message: 'Repayment schedules retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch repayment schedules', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('loans/:loanId/repayments')
  async recordRepayment(
    @Param('loanId') loanId: string,
    @Body() dto: RecordRepaymentDto,
    @Request() req: any,
  ) {
    try {
      const data = await this.loansService.recordRepayment(loanId, dto, req.user.id);
      return { success: true, message: 'Repayment recorded successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to record repayment', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
