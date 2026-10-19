import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiCreateRequest() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Отправить заявку на обмен навыками' }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Заявка создана',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Нельзя отправить заявку самому себе',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Пользователь не авторизован',
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Предлагать можно только свой навык',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Навык не найден',
    }),
  );
}

export function ApiGetIncomingRequests() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Получить входящие заявки',
      description:
        'Возвращает актуальные входящие заявки со статусом pending или inProgress',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Список входящих заявок',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Пользователь не авторизован',
    }),
  );
}

export function ApiGetOutgoingRequests() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Получить исходящие заявки',
      description:
        'Возвращает актуальные исходящие заявки со статусом pending или inProgress',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Список исходящих заявок',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Пользователь не авторизован',
    }),
  );
}
