import { IsInt, IsOptional, IsIn, Min } from 'class-validator';

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
