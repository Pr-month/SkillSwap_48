import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiLogin() {
  return applyDecorators(
    ApiOperation({ summary: 'Вход в аккаунт' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Успешный вход' }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Неверный email или пароль',
    }),
  );
}

export function ApiRegister() {
  return applyDecorators(
    ApiOperation({ summary: 'Регистрация пользователя' }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Пользователь зарегистрирован',
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Пользователь с таким email уже существует',
    }),
  );
}

export function ApiRefresh() {
  return applyDecorators(
    ApiOperation({ summary: 'Обновление токенов' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Токены обновлены' }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Невалидный refresh-токен',
    }),
  );
}

export function ApiLogout() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Выход из аккаунта' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Успешный выход' }),
  );
}
