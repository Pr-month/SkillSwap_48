# Добро пожаловать в проект SkillSwapAPI

## Документация
[Техническое задание](https://docs.google.com/document/d/1d4o9Sb9o6lxXuqdEgKe4eRlH2s7gKrh0icJ3gyv2FD4/edit?tab=t.0#heading=h.ynonjn54b672) <br>
[Макет](https://www.figma.com/design/bKwOakHJI7Z2mh2zVCBphP/SkillSwap---Для-разработчиков?node-id=0-1&p=f&t=HH7S4bYwVVtxLM6z-0)

## Запуск в Docker

Нужен установленный Docker с Docker Compose. Из корня репозитория:

```bash
docker compose up --build
```

Поднимаются PostgreSQL и backend. Перед стартом backend автоматически применяет миграции.

- API: http://localhost:3000
- Swagger: http://localhost:3000/api/docs

Перед первым запуском создайте файл `.env` в корне репозитория:

```bash
cp .env.example .env
```

Обязательно заполните в нём четыре переменные, без них `docker compose` не запустится:

- `POSTGRES_PASSWORD` — пароль БД (любой, можно со спецсимволами; значение со спецсимволами берите в одинарные кавычки);
- `JWT_ACCESS_SECRET` и `JWT_REFRESH_SECRET` — секреты для токенов, разные между собой;
- `ADMIN_PASSWORD` — пароль администратора.

Сгенерировать секрет можно так:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Остальные настройки (порт, сроки жизни токенов и т.д.) необязательны, у них есть значения по умолчанию.

Данные БД и загруженные файлы хранятся в volumes `postgres_data` и `uploads` и не теряются при перезапуске. Остановить: `docker compose down`, остановить и удалить данные: `docker compose down -v`.

Создать администратора (по желанию):

```bash
docker compose exec backend node dist/src/scripts/seed-admin.js
```

## Основные ветки

- `main` — стабильная, протестированная версия приложения (MVP). Прямой пуш запрещён. Мерж осуществляется только после прохождения всех тестов.
- `dev` — общая ветка разработки. Содержит актуальные изменения и обновляется по завершению недельных итераций.

---

## Недельный процесс разработки

Каждая неделя работы оформляется отдельной веткой `weekN`, которая создаётся от `dev`. Эта ветка включает:

- все инфраструктурные изменения (например, настройку базы данных, логгера, .env),
- pull request'ы студентов за текущую неделю.

### Шаги:

#### 1. Создание ветки недели (выполняется наставником)

```bash
git checkout dev
git pull origin dev
git checkout -b week1
git push origin week1
```

В эту ветку добавляются инфраструктурные изменения. Они могут быть оформлены через отдельный PR или пушем напрямую.

#### 2. Работа студентов

Каждый студент создаёт персональную ветку от `week1`:

```bash
git checkout week1
git pull origin week1
git checkout -b week1-username
git push origin week1-username
```

Работа выполняется в этой ветке.

#### 3. Отправка на проверку

В конце недели создаётся pull request из `week1-username` в `week1`.

После прохождения линтера и ревью изменения мержатся в `week1`.

#### 4. Финальный мерж недели

После завершения всех PR в `week1`, наставник мержит `week1` в `dev`:

```bash
git checkout dev
git pull origin dev
git merge week1
git push origin dev
```

---

## Политика веток и CI

- Прямой пуш в `main` и `dev` запрещён.
- Все изменения происходят через pull request'ы.
- Ветка `main` запускает полный набор проверок:
  - `lint`
  - `unit тесты`
  - `e2e тесты`
- В остальных ветках запускается только `lint`.

---

## CI-проверки

- Для PR в `main` — полный набор тестов.
- Для всех остальных веток — только линтер (`npm run lint`).

---

## Обновление локальных веток

После мержей студенты обновляют свои ветки при необходимости:

```bash
git checkout week1-username
git pull origin week1
```

---

## Пример именования веток

- Ветка недели: `week1`
- Ветка студента: `week1-johndoe`

---

## Проверка заданий

- Ревью проводится по pull request'ам в ветку `weekN`.
- Итоговый merge недели осуществляется наставником в ветку `dev`.
