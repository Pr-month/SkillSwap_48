import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetCitiesDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string = '';
}
