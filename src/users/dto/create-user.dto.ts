// src/users/dto/create-user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Gender } from '../users.enums';

export class CreateUserDto {
  @ApiProperty({
    description: 'Имя пользователя',
    example: 'Иван Иванов',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @Length(2, 100)
  name!: string;

  @ApiProperty({
    description: 'Email пользователя',
    example: 'ivan@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Пароль пользователя',
    example: 'password123',
    minLength: 6,
    maxLength: 100,
  })
  @IsString()
  @Length(6, 100)
  password!: string;

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
    description: 'Город',
    example: 'Москва',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  city?: string;

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