# SkillSwap API

Backend сервиса обмена навыками SkillSwap: пользователи публикуют навыки, которым могут научить, и отправляют друг другу запросы на обмен.

## Документация

- [Техническое задание](https://docs.google.com/document/d/1d4o9Sb9o6lxXuqdEgKe4eRlH2s7gKrh0icJ3gyv2FD4/edit?tab=t.0#heading=h.ynonjn54b672)
- [Макет](https://www.figma.com/design/bKwOakHJI7Z2mh2zVCBphP/SkillSwap---Для-разработчиков?node-id=0-1&p=f&t=HH7S4bYwVVtxLM6z-0)
- Swagger (после запуска): http://localhost:3000/api/docs

## Стек

- NestJS 11, TypeScript
- PostgreSQL 15, TypeORM (миграции)
- JWT-аутентификация (access и refresh токены), Passport
- Swagger, class-validator
- Socket.IO (уведомления), загрузка файлов (multer)
- Docker и Docker Compose
- Jest (unit и e2e тесты)

## Возможности

- Регистрация, вход, обновление токенов, выход
- Профиль пользователя, смена пароля, выбор города
- Навыки: создание, просмотр, редактирование, удаление, избранное, похожие навыки
- Категории и справочник городов
- Запросы на обмен навыками (входящие, исходящие, смена статуса)
- Загрузка изображений
- Роли: пользователь и администратор

## Быстрый старт (Docker)

Нужны Docker и Docker Compose. Из корня репозитория:

```bash
cp .env.example .env
```

Заполните в `.env` обязательные переменные, без них `docker compose` не запустится:

| Переменная | Описание |
| --- | --- |
| `POSTGRES_PASSWORD` | пароль БД (любой; значение со спецсимволами берите в одинарные кавычки) |
| `JWT_ACCESS_SECRET` | секрет access-токена |
| `JWT_REFRESH_SECRET` | секрет refresh-токена (отличается от access) |
| `ADMIN_PASSWORD` | пароль администратора |

Сгенерировать секрет:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Остальные переменные (порт, сроки жизни токенов, `ADMIN_EMAIL` и др.) необязательны, значения по умолчанию указаны в `.env.example`.

Запуск:

```bash
docker compose up --build
```

Поднимаются PostgreSQL и backend, миграции применяются автоматически.

- API: http://localhost:3000
- Swagger: http://localhost:3000/api/docs

Данные БД и загруженные файлы хранятся в volumes `postgres_data` и `uploads`. Остановить: `docker compose down`, остановить и удалить данные: `docker compose down -v`.

Если вы меняли `POSTGRES_PASSWORD` после первого запуска, выполните `docker compose down -v`: БД запоминает пароль при создании.

Создать администратора (по желанию):

```bash
docker compose exec backend node dist/src/scripts/seed-admin.js
```

## Запуск без Docker (разработка)

Нужны Node.js 20+ и PostgreSQL. Подробная инструкция по базе: `backend/docs/database-setup.md`.

```bash
cd backend
cp .env.example .env     # заполните JWT-секреты, ADMIN_PASSWORD и параметры БД
npm ci
npm run migration:run
npm run start:dev
```

Подключение к БД задаётся одной строкой `LOCAL_DATABASE_URL` либо отдельными переменными `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (удобнее, если в пароле есть спецсимволы). Режим `DB_MODE=supabase` использует `DATABASE_URL`.

Полезные команды (из папки `backend`):

| Команда | Назначение |
| --- | --- |
| `npm run start:dev` | запуск с автоперезагрузкой |
| `npm run build` | сборка |
| `npm run migration:run` | применить миграции |
| `npm run migration:generate -- src/migrations/Name` | сгенерировать миграцию по изменениям сущностей |
| `npm run migration:revert` | откатить последнюю миграцию |
| `npm run seed:admin` | создать администратора |
| `npm run seed:cities` | загрузить справочник городов |

## Тесты

```bash
cd backend
npm run test        # unit-тесты
npm run test:e2e    # e2e-тесты, нужна БД (см. .env.test.local.example)
npm run lint        # линтер
```

## Структура

```
.
├── docker-compose.yml     # PostgreSQL + backend
├── .env.example           # переменные для docker compose
└── backend/
    ├── src/
    │   ├── auth/          # регистрация, вход, токены
    │   ├── users/         # профиль пользователя
    │   ├── skills/        # навыки, избранное
    │   ├── categories/    # категории
    │   ├── cities/        # города
    │   ├── requests/      # запросы на обмен
    │   ├── files/         # загрузка файлов
    │   ├── notifications/ # WebSocket-уведомления
    │   ├── migrations/    # миграции БД
    │   └── scripts/       # seed-скрипты
    └── test/              # e2e-тесты
```

## Разработка и CI

- `main` — стабильная версия, прямой пуш запрещён, мерж после полного набора проверок (lint, unit, e2e).
- `dev` — общая ветка разработки.
- Каждая задача делается в отдельной ветке от `dev` и вливается через pull request.
- В pull request'ах запускаются линтер и проверка production-сборки; unit и e2e тесты запускаются для PR в `main`.