import { IsUUID } from 'class-validator';

export class CreateRequestDto {
  @IsUUID()
  offeredSkillId!: string;

  @IsUUID()
  requestedSkillId!: string;
}
