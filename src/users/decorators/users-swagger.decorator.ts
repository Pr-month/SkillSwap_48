// src/users/decorators/users-swagger.decorator.ts
import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UserResponseDto } from '../dto/user-response.dto';

export function ApiFindAllUsers() {
  return applyDecorators(
    ApiOperation({ summary: 'Получить список всех пользователей' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Список пользователей',
      type: [UserResponseDto],
    }),
  );
}

export function ApiGetMe() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Получить данные текущего пользователя' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Данные текущего пользователя',
      type: UserResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Не авторизован',
    }),
  );
}

export function ApiUpdateMe() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Обновить данные текущего пользователя' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Обновлённые данные пользователя',
      type: UserResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Не авторизован',
    }),
  );
}

export function ApiUpdatePassword() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Обновить пароль текущего пользователя' }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Пароль успешно обновлён',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Не авторизован',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Неверный старый пароль',
    }),
  );
}