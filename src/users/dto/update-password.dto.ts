import { IsString, Length } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  @Length(6, 100)
  oldPassword!: string;

  @IsString()
  @Length(6, 100)
  newPassword!: string;
}
