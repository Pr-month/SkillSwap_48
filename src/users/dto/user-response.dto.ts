// src/users/dto/user-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, UserRole } from '../users.enums';
import { CityResponseDto } from '../../cities/dto/city-response.dto';

export class UserResponseDto {
  @ApiProperty({
    description: 'Уникальный идентификатор пользователя',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id!: string;

  @ApiProperty({
    description: 'Имя пользователя',
    example: 'Иван Иванов',
  })
  name!: string;

  @ApiProperty({
    description: 'Email пользователя',
    example: 'ivan@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Информация о пользователе',
    example: 'Люблю программировать и учить других',
  })
  about!: string;

  @ApiProperty({
    description: 'Дата рождения',
    example: '1990-01-01',
  })
  birthdate!: string;

  @ApiPropertyOptional({
    description: 'Город',
    type: CityResponseDto,
    nullable: true,
  })
  city?: CityResponseDto | null;

  @ApiProperty({
    description: 'Пол',
    enum: Gender,
    example: Gender.MALE,
  })
  gender!: Gender;

  @ApiProperty({
    description: 'Ссылка на аватар',
    example: '/public/uploads/avatar.jpg',
  })
  avatar!: string;

  @ApiProperty({
    description: 'Роль пользователя',
    enum: UserRole,
    example: UserRole.USER,
  })
  role!: UserRole;

  @ApiPropertyOptional({
    description: 'Навыки, которые создал пользователь',
    type: () => [Object],
    example: [],
  })
  skills?: any[];

  @ApiPropertyOptional({
    description: 'Категории, которым пользователь хочет научиться',
    type: () => [Object],
    example: [],
  })
  wantToLearn?: any[];

  @ApiPropertyOptional({
    description: 'Избранные навыки',
    type: () => [Object],
    example: [],
  })
  favoriteSkills?: any[];
}