import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

export function ApiUploadFile() {
  return applyDecorators(
    ApiOperation({ summary: 'Загрузка файла' }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['file'],
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Загружаемый файл размером не более 2 МБ',
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
      description: 'Файл не передан или превышает допустимый размер 2 МБ',
    }),
  );
}
