// src/users/dto/update-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({
    description: 'Текущий пароль',
    example: 'password123',
    minLength: 6,
    maxLength: 100,
  })
  @IsString()
  @Length(6, 100)
  oldPassword!: string;

  @ApiProperty({
    description: 'Новый пароль',
    example: 'newPassword456',
    minLength: 6,
    maxLength: 100,
  })
  @IsString()
  @Length(6, 100)
  newPassword!: string;
}