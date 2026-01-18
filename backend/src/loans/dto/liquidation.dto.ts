import { IsString, IsInt, IsOptional, IsIn, Min } from 'class-validator';

export class CreateLiquidationDto {
  @IsString()
  @IsIn(['partial', 'complete'])
  liquidationType!: 'partial' | 'complete';

  @IsInt()
  @Min(1)
  requestedAmount!: number;

  @IsOptional()
  @IsString()
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

export class ApproveLiquidationDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectLiquidationDto {
  @IsString()
  reason!: string;
}

export class CalculateLiquidationDto {
  @IsString()
  @IsIn(['partial', 'complete'])
  liquidationType!: 'partial' | 'complete';

  @IsOptional()
  @IsInt()
  @Min(1)
  requestedAmount?: number; // Required for partial liquidation
}
