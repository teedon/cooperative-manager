import { IsString, IsInt, IsDateString, IsBoolean, IsArray, IsOptional, IsEnum, Min, IsNumber } from 'class-validator';

// Settings DTO
export class EsusuSettingsDto {
  @IsNumber()
  @Min(0)
  commissionRate!: number;

  @IsString()
  @IsEnum(['weekly', 'monthly'])
  defaultFrequency!: string;
}

// Create Esusu DTO
export class CreateEsusuDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  contributionAmount!: number;

  @IsString()
  @IsEnum(['weekly', 'monthly'])
  frequency!: string;

  @IsString()
  @IsEnum(['random', 'first_come', 'selection'])
  orderType!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  invitationDeadline!: string;

  @IsArray()
  @IsString({ each: true })
  memberIds!: string[];
}

// Update Esusu DTO (limited updates before start)
export class UpdateEsusuDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  invitationDeadline?: string;
}

// Respond to invitation DTO
export class RespondToInvitationDto {
  @IsString()
  @IsEnum(['accepted', 'declined'])
  status!: 'accepted' | 'declined';

  @IsOptional()
  @IsInt()
  @Min(1)
  preferredOrder?: number;
}

// Set Order DTO (for manual ordering)
export class SetOrderDto {
  @IsArray()
  memberOrders!: Array<{
    memberId: string;
    order: number;
  }>;
}

// Record Contribution DTO
export class RecordContributionDto {
  @IsString()
  memberId!: string;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsString()
  @IsEnum(['cash', 'transfer', 'wallet'])
  paymentMethod!: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// Process Collection DTO
export class ProcessCollectionDto {
  @IsString()
  @IsEnum(['cash', 'transfer', 'wallet'])
  paymentMethod!: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
