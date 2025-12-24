import { IsString, IsEnum } from 'class-validator';

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  CELEBRATE = 'celebrate',
  SUPPORT = 'support',
  INSIGHTFUL = 'insightful',
  THINKING = 'thinking',
}

export class AddReactionDto {
  @IsEnum(ReactionType)
  reactionType!: ReactionType;
}
