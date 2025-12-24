import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PollOptionDto {
  @IsString()
  @IsNotEmpty()
  text!: string;
}

export class CreatePollDto {
  @IsString()
  @IsNotEmpty()
  cooperativeId!: string;

  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ArrayMinSize(2, { message: 'Poll must have at least 2 options' })
  @ValidateNested({ each: true })
  @Type(() => PollOptionDto)
  options!: PollOptionDto[];

  @IsBoolean()
  @IsOptional()
  allowMultipleVotes?: boolean;

  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;

  @IsDateString()
  @IsOptional()
  endsAt?: string;
}
