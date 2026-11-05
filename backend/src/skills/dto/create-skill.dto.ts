import { IsArray, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSkillDto {
  @ApiProperty({
    description: 'Название навыка',
    example: 'Английский язык',
    minLength: 2,
    maxLength: 150,
  })
  @IsString()
  @Length(2, 150)
  title!: string;

  @ApiProperty({
    description: 'Описание навыка',
    example: 'Обучение английскому языку.',
    minLength: 2,
    maxLength: 1000,
  })
  @IsString()
  @Length(2, 1000)
  description!: string;

  @ApiProperty({
    description: 'UUID существующей категории навыка',
    format: 'uuid',
    example: '25ac8264-c483-4bee-8f43-3169e03c101c',
  })
  @IsUUID()
  category!: string;

  @ApiPropertyOptional({
    description: 'Адреса изображений после загрузки через POST /files/upload',
    type: [String],
    example: ['/public/uploads/skill-example.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
