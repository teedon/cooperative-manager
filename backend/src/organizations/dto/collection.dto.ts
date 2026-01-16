import { IsString, IsInt, IsOptional, IsDateString, IsEnum, IsArray, ValidateNested, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCollectionDto {
  @IsDateString()
  @IsNotEmpty()
  collectionDate!: string;
}

export class AddTransactionDto {
  @IsString()
  @IsNotEmpty()
  cooperativeId!: string;

  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @IsEnum(['contribution', 'loan_repayment', 'ajo_payment', 'esusu_contribution', 'share_purchase'])
  @IsNotEmpty()
  type!: string;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsEnum(['cash', 'bank_transfer', 'mobile_money', 'check'])
  @IsNotEmpty()
  paymentMethod!: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  metadata?: any; // JSON metadata for specific transaction types
}

export class UpdateTransactionDto {
  @IsString()
  @IsOptional()
  cooperativeId?: string;

  @IsString()
  @IsOptional()
  memberId?: string;

  @IsEnum(['contribution', 'loan_repayment', 'ajo_payment', 'esusu_contribution', 'share_purchase'])
  @IsOptional()
  type?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  amount?: number;

  @IsEnum(['cash', 'bank_transfer', 'mobile_money', 'check'])
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  metadata?: any;
}

export class SubmitCollectionDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ApproveCollectionDto {
  @IsString()
  @IsOptional()
  approvalNotes?: string;
}

export class RejectCollectionDto {
  @IsString()
  @IsNotEmpty()
  rejectionReason!: string;
}
