import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '../../users/users.enums';

export class RegisterDto {
  @ApiProperty({ example: 'Иван', description: 'Имя пользователя' })
  @IsString()
  @Length(2, 100)
  name!: string;

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

  @ApiProperty({ example: 'password123', description: 'Пароль', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @ApiProperty({ example: 'Немного о себе', description: 'О себе' })
  @IsString()
  about!: string;

  @ApiProperty({ example: '1995-05-20', description: 'Дата рождения' })
  @IsDateString()
  birthdate!: string;

  @ApiProperty({ example: 'Москва', description: 'Город' })
  @IsString()
  @Length(1, 100)
  city!: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE, description: 'Пол' })
  @IsEnum(Gender)
  gender!: Gender;

  @ApiProperty({ example: '', description: 'Аватар', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;
}
