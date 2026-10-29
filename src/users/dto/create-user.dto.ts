// src/users/dto/create-user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MinLength,
} from 'class-validator';
import { Gender } from '../users.enums';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_BYTES,
} from '../../common/constants/password.constants';
import { MaxByteLength } from '../../common/validators/max-byte-length.validator';

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
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_BYTES,
  })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `Пароль должен быть не менее ${PASSWORD_MIN_LENGTH} символов`,
  })
  @MaxByteLength(PASSWORD_MAX_BYTES)
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