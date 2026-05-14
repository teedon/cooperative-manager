import { IsIn, IsOptional, IsString } from 'class-validator';

export class ListFeePaymentsDto {
  @IsOptional()
  @IsString()
  memberId?: string;

  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  status?: 'pending' | 'approved' | 'rejected';
}
