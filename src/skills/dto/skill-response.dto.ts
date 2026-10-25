import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, UserRole } from '../../users/users.enums';

export class SkillCategoryResponseDto {
  @ApiProperty({
    description: 'UUID категории',
    format: 'uuid',
    example: '25ac8264-c483-4bee-8f43-3169e03c101c',
  })
  id!: string;

  @ApiPropertyOptional({
    description: 'Название категории',
    example: 'Английский',
  })
  name?: string;
}

export class SkillUserResponseDto {
  @ApiProperty({
    description: 'UUID пользователя',
    format: 'uuid',
    example: 'dc8387e8-703d-46c2-8ca6-240925334e9d',
  })
  id!: string;

  @ApiPropertyOptional({ description: 'Имя пользователя', example: 'Анна' })
  name?: string;

  @ApiPropertyOptional({ format: 'email', example: 'user1@example.com' })
  email?: string;

  @ApiPropertyOptional({
    description: 'О себе',
    example: 'Люблю изучать языки.',
  })
  about?: string;

  @ApiPropertyOptional({ format: 'date', example: '1995-05-20' })
  birthdate?: string;

  @ApiPropertyOptional({ description: 'Город', example: 'Москва' })
  city?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.FEMALE })
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Адрес аватара', example: '' })
  avatar?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.USER })
  role?: UserRole;
}

export class SkillResponseDto {
  @ApiProperty({
    description: 'UUID навыка',
    format: 'uuid',
    example: '6f1c1f3e-6c1a-4d3b-9a43-2d6a5c1e9b10',
  })
  id!: string;

  @ApiProperty({ description: 'Название навыка', example: 'Английский язык' })
  title!: string;

  @ApiProperty({
    description: 'Описание навыка',
    example: 'Обучение английскому языку.',
  })
  description!: string;

  @ApiProperty({
    description: 'Адреса изображений',
    type: [String],
    example: [],
  })
  images!: string[];

  @ApiPropertyOptional({
    description:
      'Категория, если связь включена в ответ. Может содержать только id.',
    type: SkillCategoryResponseDto,
  })
  category?: SkillCategoryResponseDto;

  @ApiPropertyOptional({
    description:
      'Владелец, если связь включена в ответ. Может содержать только id.',
    type: SkillUserResponseDto,
    nullable: true,
  })
  owner?: SkillUserResponseDto | null;
}

export class PaginatedSkillsResponseDto {
  @ApiProperty({
    description: 'Навыки текущей страницы',
    type: [SkillResponseDto],
  })
  data!: SkillResponseDto[];

  @ApiProperty({ description: 'Номер страницы', type: 'integer', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Размер страницы', type: 'integer', example: 10 })
  limit!: number;

  @ApiProperty({ description: 'Всего навыков', type: 'integer', example: 2 })
  total!: number;

  @ApiProperty({ description: 'Всего страниц', type: 'integer', example: 1 })
  totalPages!: number;
}
