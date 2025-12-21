import { IsString, IsOptional, IsInt, IsDateString, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsDateString()
  expenseDate!: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  vendorName?: string;

  @IsOptional()
  @IsString()
  vendorContact?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  paymentReference?: string;
}

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  vendorName?: string;

  @IsOptional()
  @IsString()
  vendorContact?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  paymentReference?: string;
}

export class ApproveExpenseDto {
  @IsString()
  status!: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
