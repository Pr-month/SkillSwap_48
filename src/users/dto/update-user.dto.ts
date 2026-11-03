// src/users/dto/update-user.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { Gender } from '../users.enums';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Имя пользователя',
    example: 'Иван Иванов',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Информация о пользователе',
    example: 'Люблю программировать и учить других',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  about?: string;

  @ApiPropertyOptional({
    description: 'Дата рождения',
    example: '1990-01-01',
  })
  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @ApiPropertyOptional({
    description: 'ID города',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @ApiPropertyOptional({
    description: 'Пол',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Ссылка на аватар',
    example: '/public/uploads/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatar?: string;
}