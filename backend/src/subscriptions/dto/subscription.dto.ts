import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';

export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class InitializeSubscriptionDto {
  @IsString()
  cooperativeId!: string;

  @IsString()
  planId!: string;

  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle = BillingCycle.MONTHLY;

  @IsString()
  @IsOptional()
  callbackUrl?: string;
}

export class VerifyPaymentDto {
  @IsString()
  reference!: string;
}

export class ChangePlanDto {
  @IsString()
  newPlanId!: string;

  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;
}

export class CancelSubscriptionDto {
  @IsString()
  @IsOptional()
  reason?: string;

  @IsOptional()
  cancelImmediately?: boolean = false;
}

export class CreatePlanDto {
  @IsString()
  name!: string;

  @IsString()
  displayName!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  monthlyPrice!: number;

  @IsNumber()
  @IsOptional()
  yearlyPrice?: number;

  @IsNumber()
  @IsOptional()
  maxMembers?: number;

  @IsNumber()
  @IsOptional()
  maxContributionPlans?: number;

  @IsNumber()
  @IsOptional()
  maxLoansPerMonth?: number;

  @IsNumber()
  @IsOptional()
  maxGroupBuys?: number;

  @IsOptional()
  features?: string[];
}
