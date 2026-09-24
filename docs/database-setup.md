# Настройка и запуск PostgreSQL

Приложение может работать с двумя вариантами PostgreSQL:

1. **Локальный PostgreSQL** — база находится на компьютере, для управления используется pgAdmin.
2. **Supabase** — облачная PostgreSQL-база для тех, кто не может установить PostgreSQL локально.

Переключение выполняется командами:

```bash
npm run start:dev:local
```

или:

```bash
npm run start:dev:supabase
```

## 1. Подготовка проекта

После клонирования репозитория перейдите в папку проекта и установите зависимости:

```bash
npm install
```

Создайте в корне проекта файл:

```text
.env
```

Файл должен находиться рядом с `package.json`.

Пример структуры `.env`:

```env
DB_MODE=local

LOCAL_DATABASE_URL="postgresql://postgres:YOUR_LOCAL_PASSWORD@localhost:5432/skillswap"

DATABASE_URL="postgresql://postgres.PROJECT_REF:YOUR_SUPABASE_PASSWORD@SESSION_POOLER_HOST:5432/postgres?uselibpqcompat=true&sslmode=require"

DB_SYNCHRONIZE=false
DB_LOGGING=true

PORT=3000
```

Обе строки подключения можно хранить одновременно. Команда запуска сама выберет нужную.

---

# Локальный PostgreSQL

## 2. Установка PostgreSQL

Скачайте PostgreSQL с официального сайта:

https://www.postgresql.org/download/

Во время установки:

1. Оставьте выбранными PostgreSQL Server и pgAdmin.
2. Укажите пароль пользователя `postgres`.
3. Обязательно сохраните этот пароль.
4. Обратите внимание на выбранный порт.

Стандартный порт PostgreSQL:

```text
5432
```

Если он занят, установщик может предложить другой порт.

Использовать нужно именно тот порт, который выбран при установке.

## 3. Создание локальной базы через pgAdmin

1. Откройте pgAdmin.
2. Слева раскройте `Servers`.
3. Подключитесь к локальному серверу PostgreSQL.
4. Введите пароль пользователя `postgres`, заданный при установке.
5. Нажмите правой кнопкой на `Databases`.
6. Выберите `Create → Database`.
7. Укажите название:

```text
skillswap
```

8. В поле владельца оставьте:

```text
postgres
```

9. Нажмите `Save`.

## 4. Проверка локального порта

Порт локального сервера может отличаться от стандартного.

Чтобы его проверить:

1. Нажмите правой кнопкой на сервер PostgreSQL в pgAdmin.
2. Выберите `Properties`.
3. Откройте вкладку `Connection`.
4. Посмотрите поле `Port`.

## 5. Настройка локального подключения

В `.env` укажите:

```env
LOCAL_DATABASE_URL="postgresql://postgres:YOUR_LOCAL_PASSWORD@localhost:5432/skillswap"
```

Замените:

- `YOUR_LOCAL_PASSWORD` — на пароль пользователя `postgres`;
- `5432` — на реальный локальный порт, если он отличается от стандартного.

```env
LOCAL_DATABASE_URL="postgresql://postgres:YOUR_LOCAL_PASSWORD@localhost:5599/skillswap"
```

Если пароль содержит специальные символы, их нужно закодировать:

| Символ | Значение в URL |
| ------ | -------------- |
| `@`    | `%40`          |
| `#`    | `%23`          |
| `?`    | `%3F`          |
| `/`    | `%2F`          |
| `:`    | `%3A`          |
| пробел | `%20`          |

## 6. Запуск с локальной базой

Выполните:

```bash
npm run start:dev:local
```

Команда принудительно выбирает `LOCAL_DATABASE_URL`, независимо от значения `DB_MODE` в `.env`.

---

# Supabase

## 7. Создание организации

Откройте:

https://supabase.com/

При создании организации можно выбрать:

```text
Name: название команды или проекта
Type: Personal
Plan: Free
```

После заполнения нажмите:

```text
Create organization
```

## 8. Создание проекта Supabase

Внутри организации нажмите:

```text
New project
```

Заполните:

- название проекта, например `SkillSwap`;
- пароль базы данных;
- ближайший доступный регион;
- тариф `Free`.

Обязательно сохраните пароль базы данных. Это не пароль от аккаунта Supabase, а отдельный пароль PostgreSQL.

После создания проекта Supabase автоматически создаст PostgreSQL-базу с названием:

```text
postgres
```

## 9. Получение строки подключения

В проекте Supabase нажмите:

```text
Connect
```

В открывшемся окне могут отображаться варианты:

- Framework;
- Server;
- Direct;
- ORM;
- MCP.

Выберите:

1. Вкладку `Direct — Connection string`.
2. Способ подключения `Session pooler`.
3. Тип `URI`.

Строка Session pooler выглядит примерно так:

```text
postgresql://postgres.PROJECT_REF:[YOUR-PASSWORD]@HOST.pooler.supabase.com:5432/postgres
```

Скопируйте её и замените:

```text
[YOUR-PASSWORD]
```

на пароль базы Supabase.

Если пароль содержит специальные символы, используйте процентное кодирование из таблицы выше.

В конец строки добавьте:

```text
?uselibpqcompat=true&sslmode=require
```

Готовая строка должна иметь следующую структуру:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:YOUR_SUPABASE_PASSWORD@SESSION_POOLER_HOST:5432/postgres?uselibpqcompat=true&sslmode=require"
```

## 10. Запуск с Supabase

Выполните:

```bash
npm run start:dev:supabase
```

Команда принудительно выбирает `DATABASE_URL`, независимо от значения `DB_MODE` в `.env`.

---

# Переключение между базами

## 11. Команды запуска

Локальный PostgreSQL:

```bash
npm run start:dev:local
```

Общая база Supabase:

```bash
npm run start:dev:supabase
```

Обычная команда:

```bash
npm run start:dev
```

использует значение `DB_MODE` из `.env`.

Для локальной базы:

```env
DB_MODE=local
```

Для Supabase:

```env
DB_MODE=supabase
```

## 12. Особенность на данном этапе, пока командой не согласованы Entities

По умолчанию используется:

```env
DB_SYNCHRONIZE=false
```

В этом режиме приложение подключается к базе, но TypeORM не создаёт и не изменяет таблицы автоматически.

После согласования Entity для проверки тестовых данных синхронизацию можно включить:

```env
DB_SYNCHRONIZE=true
```
