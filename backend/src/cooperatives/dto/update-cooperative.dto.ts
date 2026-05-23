import { IsOptional, IsString, IsBoolean, IsIn, Matches } from 'class-validator';
import { GRADIENT_PRESETS, GradientPreset } from './create-cooperative.dto';
import { NIGERIAN_BANKS } from '../nigerian-banks';

export class UpdateCooperativeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  useGradient?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(GRADIENT_PRESETS)
  gradientPreset?: GradientPreset;

  @IsOptional()
  @IsString()
  @IsIn(NIGERIAN_BANKS)
  collectionBankName?: string | null;

  @IsOptional()
  @Matches(/^\d{10}$/)
  collectionAccountNumber?: string | null;

  @IsOptional()
  @IsString()
  collectionAccountHolderName?: string | null;

  @IsOptional()
  @IsString()
  status?: string;
}
