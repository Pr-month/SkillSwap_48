// src/cities/dto/update-city.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCityDto } from './create-city.dto';

export class UpdateCityDto extends PartialType(CreateCityDto) {
  @ApiPropertyOptional({
    description: 'Название города',
    example: 'Санкт-Петербург',
    minLength: 1,
    maxLength: 100,
  })
  name?: string;
}