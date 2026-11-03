// src/auth/dto/login.dto.ts
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_BYTES,
} from '../../common/constants/password.constants';
import { MaxByteLength } from '../../common/validators/max-byte-length.validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email пользователя',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: 'password123', description: 'Пароль' })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `Пароль должен быть не менее ${PASSWORD_MIN_LENGTH} символов`,
  })
  @MaxByteLength(PASSWORD_MAX_BYTES)
  password!: string;
}