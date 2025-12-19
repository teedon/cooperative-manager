import { IsString, IsBoolean, IsOptional, IsObject, IsIn } from 'class-validator';

export class RegisterFcmTokenDto {
  @IsString()
  token!: string;

  @IsIn(['ios', 'android'])
  platform!: 'ios' | 'android';
}

export class UpdatePreferencesDto {
  @IsBoolean()
  @IsOptional()
  pushEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  contributionReminders?: boolean;

  @IsBoolean()
  @IsOptional()
  loanUpdates?: boolean;

  @IsBoolean()
  @IsOptional()
  groupBuyUpdates?: boolean;

  @IsBoolean()
  @IsOptional()
  memberUpdates?: boolean;

  @IsBoolean()
  @IsOptional()
  announcements?: boolean;

  @IsBoolean()
  @IsOptional()
  mentions?: boolean;
}

export class CreateNotificationDto {
  @IsString()
  userId!: string;

  @IsString()
  @IsOptional()
  cooperativeId?: string;

  @IsString()
  type!: string;

  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsString()
  @IsOptional()
  actionType?: 'view' | 'approve' | 'reject' | 'pay' | 'navigate';

  @IsString()
  @IsOptional()
  actionRoute?: string;

  @IsObject()
  @IsOptional()
  actionParams?: Record<string, any>;
}

export class SendPushNotificationDto {
  @IsString()
  userId!: string;

  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}
