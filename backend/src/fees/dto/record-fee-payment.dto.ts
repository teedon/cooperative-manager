import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class RecordFeePaymentDto {
  @IsOptional()
  @IsString()
  memberId?: string;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

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
