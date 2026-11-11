import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiCreateCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Создать новую категорию' }),
    ApiResponse({ status: 201, description: 'Категория успешно создана' }),
    ApiResponse({ status: 400, description: 'Некорректные данные' }),
  );
}

export function ApiFindAllCategories() {
  return applyDecorators(
    ApiOperation({ summary: 'Получить список всех категорий' }),
    ApiResponse({ status: 200, description: 'Список категорий' }),
  );
}

export function ApiFindOneCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Получить категорию по ID' }),
    ApiParam({
      name: 'id',
      description: 'UUID категории',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({ status: 200, description: 'Категория найдена' }),
    ApiResponse({ status: 404, description: 'Категория не найдена' }),
  );
}

export function ApiUpdateCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Обновить категорию по ID' }),
    ApiParam({
      name: 'id',
      description: 'UUID категории',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({ status: 200, description: 'Категория обновлена' }),
    ApiResponse({ status: 400, description: 'Некорректные данные' }),
    ApiResponse({ status: 404, description: 'Категория не найдена' }),
  );
}

export function ApiRemoveCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Удалить категорию по ID' }),
    ApiParam({
      name: 'id',
      description: 'UUID категории',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({ status: 204, description: 'Категория удалена' }),
    ApiResponse({ status: 404, description: 'Категория не найдена' }),
  );
}
