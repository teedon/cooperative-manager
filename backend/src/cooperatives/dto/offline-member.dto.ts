import { IsString, IsOptional, IsEmail, IsBoolean, IsNumber } from 'class-validator';

export class CreateOfflineMemberDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  memberCode?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  initialBalance?: number;

  @IsOptional()
  @IsBoolean()
  autoSubscribe?: boolean;
}

export class UpdateOfflineMemberDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  memberCode?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class BulkCreateOfflineMembersDto {
  members!: CreateOfflineMemberDto[];
}

export class SubscribeOfflineMemberDto {
  @IsString()
  memberId!: string;

  @IsString()
  planId!: string;

  @IsOptional()
  amount?: number; // For notional plans
}

export class RecordOfflineMemberPaymentDto {
  @IsString()
  memberId!: string;

  @IsString()
  subscriptionId!: string;

  amount!: number;

  @IsOptional()
  @IsString()
  paymentDate?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  paymentReference?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  autoApprove?: boolean; // Admin can auto-approve payments for offline members
}
