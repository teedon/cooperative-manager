import { IsString, IsNotEmpty } from 'class-validator';

export class CastVoteDto {
  @IsString()
  @IsNotEmpty()
  optionId: string;
}
