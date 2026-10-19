import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateRequestDto {
  @ApiProperty({
    format: 'uuid',
    example: '6f1c1f3e-6c1a-4d3b-9a43-2d6a5c1e9b10',
    description: 'Навык, который предлагает отправитель',
  })
  @IsUUID()
  offeredSkillId!: string;

  @ApiProperty({
    format: 'uuid',
    example: '7a2d2e4f-7d2b-5e4c-0b54-3e7b6d2f0c21',
    description: 'Навык, который отправитель хочет получить',
  })
  @IsUUID()
  requestedSkillId!: string;
}
