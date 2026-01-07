import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards, HttpException, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { LoansService } from './loans.service';
import { SupabaseService } from '../services/supabase.service';
import { CreateLoanTypeDto, UpdateLoanTypeDto } from './dto/loan-type.dto';
import { RequestLoanDto, InitiateLoanDto, ApproveLoanDto, RejectLoanDto, RecordRepaymentDto } from './dto/loan.dto';

@Controller()
export class LoansController {
  constructor(
    private readonly loansService: LoansService,
    private readonly supabaseService: SupabaseService,
  ) {}

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

  // ==================== FILE UPLOAD ====================

  @UseGuards(AuthGuard('jwt'))
  @Post('loans/upload-url')
  async generateUploadUrl(
    @Body() dto: { fileName: string; contentType: string },
    @Request() req: any,
  ) {
    try {
      const data = await this.supabaseService.generateUploadUrl(
        'kyc-documents',
        dto.fileName,
        req.user.id,
      );
      return { success: true, message: 'Upload URL generated successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to generate upload URL', data: null },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('loans/upload-document')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('fileName') fileName: string,
    @Request() req: any,
  ) {
    try {
      if (!file) {
        throw new HttpException(
          { success: false, message: 'No file provided', data: null },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Upload file to Supabase
      const timestamp = Date.now();
      const sanitizedFileName = (fileName || file.originalname).replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${req.user.id}/${timestamp}-${sanitizedFileName}`;

      await this.supabaseService.uploadFile(
        'kyc-documents',
        filePath,
        file.buffer,
        file.mimetype,
      );

      // Get public URL (store the path, not the actual URL since bucket might be private)
      const publicUrl = this.supabaseService.getPublicUrl('kyc-documents', filePath);

      return {
        success: true,
        message: 'File uploaded successfully',
        data: {
          documentUrl: publicUrl,
          filePath,
          fileName: sanitizedFileName,
        },
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to upload file', data: null },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('loans/documents/:documentId/signed-url')
  async getDocumentSignedUrl(
    @Param('documentId') documentId: string,
    @Request() req: any,
  ) {
    try {
      const document = await this.loansService.getKycDocument(documentId, req.user.id);
      
      // Extract file path from the public URL
      const url = new URL(document.documentUrl);
      const pathParts = url.pathname.split('/public/kyc-documents/');
      const filePath = pathParts[1];

      // Generate signed URL valid for 1 hour
      const signedUrl = await this.supabaseService.getSignedUrl('kyc-documents', filePath, 3600);

      return {
        success: true,
        message: 'Signed URL generated successfully',
        data: { signedUrl },
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to generate signed URL', data: null },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== GUARANTOR ENDPOINTS ====================

  @UseGuards(AuthGuard('jwt'))
  @Get('cooperatives/:cooperativeId/loans/as-guarantor')
  async getLoansAsGuarantor(
    @Param('cooperativeId') cooperativeId: string,
    @Request() req: any,
  ) {
    try {
      const data = await this.loansService.getLoansAsGuarantor(cooperativeId, req.user.id);
      return { success: true, message: 'Loans retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch loans', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('loans/:loanId/guarantor-response')
  async respondToGuarantorRequest(
    @Param('loanId') loanId: string,
    @Body() body: { approved: boolean; reason?: string },
    @Request() req: any,
  ) {
    try {
      const data = await this.loansService.respondToGuarantorRequest(
        loanId,
        body.approved,
        body.reason,
        req.user.id,
      );
      return {
        success: true,
        message: body.approved ? 'Guarantor approval submitted successfully' : 'Guarantor rejection submitted successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to submit response', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
