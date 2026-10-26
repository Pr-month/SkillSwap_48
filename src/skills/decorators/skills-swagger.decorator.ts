import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateSkillDto } from '../dto/create-skill.dto';
import { UpdateSkillDto } from '../dto/update-skill.dto';
import {
  PaginatedSkillsResponseDto,
  SkillResponseDto,
  SkillUserResponseDto,
} from '../dto/skill-response.dto';

function ApiSkillError(status: HttpStatus, description: string) {
  return ApiResponse({
    status,
    description,
    schema: {
      type: 'object',
      required: ['statusCode', 'message', 'timestamp'],
      properties: {
        statusCode: { type: 'integer', example: status },
        message: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
          ],
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  });
}

function ApiSkillAuthorization() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiSkillError(
      HttpStatus.UNAUTHORIZED,
      'Access-токен отсутствует, недействителен или истёк',
    ),
  );
}

function ApiSkillId() {
  return ApiParam({
    name: 'id',
    description: 'UUID навыка',
    type: String,
    format: 'uuid',
    example: '6f1c1f3e-6c1a-4d3b-9a43-2d6a5c1e9b10',
  });
}

export function ApiCreateSkill() {
  return applyDecorators(
    ApiSkillAuthorization(),
    ApiOperation({
      summary: 'Создать навык',
      description:
        'Владельцем становится авторизованный пользователь. Укажите UUID существующей категории; изображения загружаются отдельно через POST /files/upload.',
    }),
    ApiBody({ type: CreateSkillDto }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Навык создан',
      type: SkillResponseDto,
    }),
    ApiSkillError(
      HttpStatus.BAD_REQUEST,
      'Невалидное тело запроса или несуществующая категория',
    ),
  );
}

export function ApiGetSkills() {
  return applyDecorators(
    ApiOperation({
      summary: 'Получить список навыков',
      description:
        'Публичный список с пагинацией. Данные владельца и категории не подгружаются.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Страница навыков и сведения о пагинации',
      type: PaginatedSkillsResponseDto,
    }),
    ApiSkillError(HttpStatus.BAD_REQUEST, 'Невалидные параметры пагинации'),
  );
}

export function ApiGetSimilarSkills() {
  return applyDecorators(
    ApiSkillAuthorization(),
    ApiSkillId(),
    ApiOperation({
      summary: 'Найти пользователей с навыками той же категории',
      description:
        'Возвращает до 10 уникальных пользователей, исключая владельца исходного навыка. Если совпадений нет, возвращает пустой массив.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Пользователи с навыками той же категории',
      type: SkillUserResponseDto,
      isArray: true,
    }),
    ApiSkillError(HttpStatus.BAD_REQUEST, 'ID навыка должен быть UUID'),
    ApiSkillError(HttpStatus.NOT_FOUND, 'Исходный навык не найден'),
  );
}

export function ApiGetSkill() {
  return applyDecorators(
    ApiSkillId(),
    ApiOperation({
      summary: 'Получить навык по ID',
      description:
        'Публичный запрос. Возвращает навык, его категорию и данные владельца без пароля и refresh-токена.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Навык найден',
      type: SkillResponseDto,
    }),
    ApiSkillError(HttpStatus.BAD_REQUEST, 'ID навыка должен быть UUID'),
    ApiSkillError(HttpStatus.NOT_FOUND, 'Навык не найден'),
  );
}

export function ApiUpdateSkill() {
  return applyDecorators(
    ApiSkillAuthorization(),
    ApiSkillId(),
    ApiOperation({
      summary: 'Обновить свой навык',
      description:
        'Передаются только изменяемые поля. Обновлять навык может только его владелец.',
    }),
    ApiBody({ type: UpdateSkillDto }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Навык обновлён',
      type: SkillResponseDto,
    }),
    ApiSkillError(
      HttpStatus.BAD_REQUEST,
      'Невалидный UUID, тело запроса или категория',
    ),
    ApiSkillError(HttpStatus.FORBIDDEN, 'Нельзя обновлять чужой навык'),
    ApiSkillError(HttpStatus.NOT_FOUND, 'Навык не найден'),
  );
}

export function ApiAddFavoriteSkill() {
  return applyDecorators(
    ApiSkillAuthorization(),
    ApiSkillId(),
    ApiOperation({ summary: 'Добавить навык в избранное' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Навык добавлен в избранное; возвращается объект навыка',
      type: SkillResponseDto,
    }),
    ApiSkillError(HttpStatus.BAD_REQUEST, 'ID навыка должен быть UUID'),
    ApiSkillError(HttpStatus.NOT_FOUND, 'Навык или пользователь не найден'),
    ApiSkillError(HttpStatus.CONFLICT, 'Навык уже находится в избранном'),
  );
}

export function ApiRemoveFavoriteSkill() {
  return applyDecorators(
    ApiSkillAuthorization(),
    ApiSkillId(),
    ApiOperation({ summary: 'Убрать навык из избранного' }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Навык убран из избранного. Тело ответа отсутствует.',
    }),
    ApiSkillError(HttpStatus.BAD_REQUEST, 'ID навыка должен быть UUID'),
    ApiSkillError(
      HttpStatus.NOT_FOUND,
      'Пользователь или навык в избранном не найден',
    ),
  );
}

export function ApiRemoveSkill() {
  return applyDecorators(
    ApiSkillAuthorization(),
    ApiSkillId(),
    ApiOperation({
      summary: 'Удалить свой навык',
      description:
        'Удаляет навык и его изображения. Доступно только владельцу.',
    }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Навык удалён. Тело ответа отсутствует.',
    }),
    ApiSkillError(HttpStatus.BAD_REQUEST, 'ID навыка должен быть UUID'),
    ApiSkillError(HttpStatus.FORBIDDEN, 'Нельзя удалять чужой навык'),
    ApiSkillError(HttpStatus.NOT_FOUND, 'Навык не найден'),
  );
}
