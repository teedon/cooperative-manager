import { IsString, IsEmail, IsOptional, IsArray, ArrayMinSize } from 'class-validator';

export class SendInviteDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  emails!: string[];

  @IsOptional()
  @IsString()
  message?: string;
}

export class SendWhatsAppInviteDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  phoneNumbers!: string[];

  @IsOptional()
  @IsString()
  message?: string;
}
