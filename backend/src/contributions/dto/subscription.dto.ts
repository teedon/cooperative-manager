import { IsInt, IsOptional, IsIn, Min, IsDateString } from 'class-validator';

export class SubscribeToContributionDto {
  @IsInt()
  @Min(1)
  amount!: number;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsIn(['active', 'paused', 'cancelled'])
  status?: 'active' | 'paused' | 'cancelled';

  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;
}

export class RestartPlanDto {
  @IsOptional()
  @IsDateString()
  newStartDate?: string;

  @IsOptional()
  @IsDateString()
  newEndDate?: string;
}
