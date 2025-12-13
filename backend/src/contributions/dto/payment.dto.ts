import { IsInt, IsOptional, IsString, IsIn, Min, IsDateString } from 'class-validator';

export class RecordPaymentDto {
  @IsInt()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsIn(['bank_transfer', 'cash', 'mobile_money', 'card'])
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  paymentReference?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ApprovePaymentDto {
  @IsIn(['approved', 'rejected'])
  status!: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
