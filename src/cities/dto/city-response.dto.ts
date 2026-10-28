// src/cities/dto/city-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CityResponseDto {
  @ApiProperty({
    description: 'Уникальный идентификатор города',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id!: string;

  @ApiProperty({
    description: 'Название города',
    example: 'Москва',
  })
  name!: string;

  @ApiPropertyOptional({
    description: 'Район',
    example: 'Центральный',
    nullable: true,
  })
  district?: string | null;

  @ApiPropertyOptional({
    description: 'Субъект федерации',
    example: 'Московская область',
    nullable: true,
  })
  subject?: string | null;

  @ApiPropertyOptional({
    description: 'Широта',
    example: 55.7558,
    nullable: true,
  })
  lat?: number | null;

  @ApiPropertyOptional({
    description: 'Долгота',
    example: 37.6173,
    nullable: true,
  })
  lon?: number | null;

  @ApiPropertyOptional({
    description: 'Население',
    example: 12600000,
    nullable: true,
  })
  population?: number | null;
}