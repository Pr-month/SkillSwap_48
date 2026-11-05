// src/cities/decorators/cities-swagger.decorator.ts
import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CityResponseDto } from '../dto/city-response.dto';

export function ApiCreateCity() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Создать новый город (только для админа)' }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Город успешно создан',
      type: CityResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Не авторизован',
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Недостаточно прав (не админ)',
    }),
  );
}

export function ApiFindAllCities() {
  return applyDecorators(
    ApiOperation({ summary: 'Получить список городов с поиском' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Список городов',
      type: [CityResponseDto],
    }),
  );
}

export function ApiFindOneCity() {
  return applyDecorators(
    ApiOperation({ summary: 'Получить город по ID' }),
    ApiParam({
      name: 'id',
      description: 'UUID города',
      example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Город найден',
      type: CityResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Город не найден',
    }),
  );
}

export function ApiUpdateCity() {
  return applyDecorators(
    ApiOperation({ summary: 'Обновить город по ID' }),
    ApiParam({
      name: 'id',
      description: 'UUID города',
      example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Город обновлён',
      type: CityResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Город не найден',
    }),
  );
}

export function ApiRemoveCity() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Удалить город (только для админа)' }),
    ApiParam({
      name: 'id',
      description: 'UUID города',
      example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Город удалён',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Не авторизован',
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Недостаточно прав (не админ)',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Город не найден',
    }),
  );
}