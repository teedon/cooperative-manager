import { IsString, IsNumber, IsOptional, IsDateString, Min, IsArray } from 'class-validator';

// Request a new loan (by member)
export class RequestLoanDto {
  @IsOptional()
  @IsString()
  loanTypeId?: string;

  @IsNumber()
  @Min(1000)
  amount!: number;

  @IsString()
  purpose!: string;

  @IsNumber()
  @Min(1)
  duration!: number; // in months

  @IsOptional()
  @IsNumber()
  @Min(0)
  interestRate?: number; // Override rate if not using loan type

  @IsOptional()
  @IsArray()
  guarantorIds?: string[];

  @IsOptional()
  @IsArray()
  kycDocuments?: Array<{
    type: string;
    documentUrl: string;
    fileName: string;
    mimeType?: string;
  }>;
}

// Admin initiates loan for a member
export class InitiateLoanDto {
  @IsString()
  memberId!: string;

  @IsOptional()
  @IsString()
  loanTypeId?: string;

  @IsNumber()
  @Min(1000)
  amount!: number;

  @IsString()
  purpose!: string;

  @IsNumber()
  @Min(1)
  duration!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  interestRate?: number;

  @IsOptional()
  @IsDateString()
  deductionStartDate?: string;
}

// Approve a loan request
export class ApproveLoanDto {
  @IsOptional()
  @IsDateString()
  deductionStartDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// Reject a loan request
export class RejectLoanDto {
  @IsString()
  reason!: string;
}

// Disburse a loan
export class DisburseLoanDto {
  @IsOptional()
  @IsDateString()
  disbursementDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// Record a repayment
export class RecordRepaymentDto {
  @IsNumber()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @IsOptional()
  @IsString()
  paymentReference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
