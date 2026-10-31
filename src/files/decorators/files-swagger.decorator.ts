import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

export function ApiUploadFile() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Загрузка изображения',
      description:
        'Требуется access-токен. Разрешены JPEG, PNG и WebP до 2 МБ. Проверяются сигнатура и окончание файла. HTML и SVG запрещены.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['file'],
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description:
              'Изображение JPEG, PNG или WebP размером не более 2 МБ',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Файл успешно загружен',
      schema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            example: '/public/uploads/550e8400-e29b-41d4-a716-446655440000.png',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description:
        'Файл отсутствует, имеет запрещённый формат, неверную сигнатуру или окончание',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Access-токен отсутствует, недействителен или истёк',
    }),
    ApiResponse({
      status: HttpStatus.PAYLOAD_TOO_LARGE,
      description: 'Размер файла превышает 2 МБ',
    }),
  );
}
