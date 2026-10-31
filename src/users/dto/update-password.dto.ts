// src/users/dto/update-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_BYTES,
} from '../../common/constants/password.constants';
import { MaxByteLength } from '../../common/validators/max-byte-length.validator';

export class UpdatePasswordDto {
  @ApiProperty({
    description: 'Текущий пароль',
    example: 'password123',
  })
  @IsString()
  oldPassword!: string;

  @ApiProperty({
    description: 'Новый пароль',
    example: 'newPassword456',
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_BYTES,
  })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `Пароль должен быть не менее ${PASSWORD_MIN_LENGTH} символов`,
  })
  @MaxByteLength(PASSWORD_MAX_BYTES)
  newPassword!: string;
}