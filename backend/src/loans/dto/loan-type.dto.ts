import { IsString, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class CreateLoanTypeDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1000)
  minAmount!: number;

  @IsNumber()
  @Min(1000)
  maxAmount!: number;

  @IsNumber()
  @Min(1)
  minDuration!: number;

  @IsNumber()
  @Min(1)
  @Max(120)
  maxDuration!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate!: number;

  @IsString()
  interestType!: string; // 'flat' | 'reducing_balance'

  @IsOptional()
  @IsNumber()
  @Min(0)
  minMembershipDuration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minSavingsBalance?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxActiveLoans?: number;

  @IsOptional()
  @IsBoolean()
  requiresGuarantor?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minGuarantors?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;
}

export class UpdateLoanTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  maxAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  minDuration?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(120)
  maxDuration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate?: number;

  @IsOptional()
  @IsString()
  interestType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minMembershipDuration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minSavingsBalance?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxActiveLoans?: number;

  @IsOptional()
  @IsBoolean()
  requiresGuarantor?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minGuarantors?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;
}
