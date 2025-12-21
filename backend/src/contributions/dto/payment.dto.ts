import { IsInt, IsOptional, IsString, IsIn, Min, IsDateString, IsArray, IsBoolean } from 'class-validator';

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

export class BulkApproveSchedulesDto {
  @IsInt()
  month!: number; // 1-12

  @IsInt()
  year!: number;

  @IsOptional()
  @IsString()
  planId?: string; // Optional: filter by specific plan

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeMemberIds?: string[]; // Member IDs to exclude from bulk approval

  @IsOptional()
  @IsIn(['bank_transfer', 'cash', 'mobile_money', 'card', 'bulk_approval'])
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// New DTO for date-based bulk approval
export class BulkApproveByDateDto {
  @IsString()
  planId!: string; // Required: specific plan

  @IsDateString()
  scheduleDate!: string; // The specific schedule date to approve

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeMemberIds?: string[]; // Member IDs to exclude from bulk approval

  @IsOptional()
  @IsBoolean()
  includeMissingSchedules?: boolean; // Include members with active subscription but no schedule for this date

  @IsOptional()
  @IsIn(['bank_transfer', 'cash', 'mobile_money', 'card', 'bulk_approval'])
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
