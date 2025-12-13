import { IsString, IsOptional, IsInt, IsBoolean, IsDateString, IsIn, ValidateIf, Min } from 'class-validator';

export class CreateContributionPlanDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['compulsory', 'optional'])
  category!: 'compulsory' | 'optional';

  @IsIn(['fixed', 'notional'])
  amountType!: 'fixed' | 'notional';

  @ValidateIf(o => o.amountType === 'fixed')
  @IsInt()
  @Min(1)
  fixedAmount?: number;

  @ValidateIf(o => o.amountType === 'notional')
  @IsOptional()
  @IsInt()
  @Min(1)
  minAmount?: number;

  @ValidateIf(o => o.amountType === 'notional')
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAmount?: number;

  @IsIn(['continuous', 'period'])
  contributionType!: 'continuous' | 'period';

  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly', 'yearly'])
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ValidateIf(o => o.contributionType === 'period')
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
