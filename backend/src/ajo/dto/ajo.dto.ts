import { IsString, IsNumber, IsDateString, IsBoolean, IsOptional, IsArray, Min } from 'class-validator';

export class CreateAjoDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  frequency!: string; // 'daily' | 'weekly' | 'monthly'

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsBoolean()
  isContinuous!: boolean;

  @IsArray()
  @IsString({ each: true })
  memberIds!: string[]; // Members to assign to this Ajo
}

export class UpdateAjoDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isContinuous?: boolean;

  @IsOptional()
  @IsString()
  status?: string; // 'active' | 'completed' | 'cancelled'
}

export class RespondToAjoDto {
  @IsString()
  status!: string; // 'accepted' | 'declined'
}

export class RecordAjoPaymentDto {
  @IsString()
  memberId!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  paymentMethod!: string; // 'cash' | 'transfer' | 'wallet'

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;
}

export class AjoSettingsDto {
  @IsNumber()
  @Min(0)
  commissionRate!: number;

  @IsNumber()
  @Min(0)
  interestRate!: number;
}
