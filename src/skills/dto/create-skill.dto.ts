import { IsArray, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateSkillDto {
  @IsString()
  @Length(2, 150)
  title!: string;

  @IsString()
  @Length(2, 1000)
  description!: string;

  @IsUUID()
  category!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
