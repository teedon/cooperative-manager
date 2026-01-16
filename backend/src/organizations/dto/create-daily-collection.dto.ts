import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, IsEnum, IsDateString, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CollectionTransactionType } from '../enums/organization-type.enum';

export class CollectionTransactionDto {
  @IsString()
  @IsNotEmpty()
  cooperativeId!: string;

  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @IsEnum(CollectionTransactionType)
  @IsNotEmpty()
  type!: CollectionTransactionType;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod!: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  metadata?: any;
}

export class CreateDailyCollectionDto {
  @IsDateString()
  @IsNotEmpty()
  collectionDate!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollectionTransactionDto)
  transactions!: CollectionTransactionDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}

export class SubmitDailyCollectionDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ApproveDailyCollectionDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RejectDailyCollectionDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
