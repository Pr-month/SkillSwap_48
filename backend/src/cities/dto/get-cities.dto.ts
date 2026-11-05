// src/cities/dto/get-cities.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetCitiesDto {
  @ApiPropertyOptional({
    description: 'Поиск по названию города',
    example: 'Москва',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string = '';
}