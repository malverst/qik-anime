# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Проект

QIK Anime (quickik.ru) — full-stack аниме-трекер: каталог/просмотр аниме + социальные фичи и геймификация. Два независимых источника данных:

- **YummyAnime API** (`api.yani.tv`) — каталог аниме, серии, поиск, расписание. Клиент: `anime-site/src/api/client.js`
- **Собственный NestJS бэкенд** (`server/`) — пользователи, закладки, рейтинги, комментарии, друзья, чаты, комнаты, XP. Клиент: `anime-site/src/api/backend.js`

Данные из двух источников сливаются на уровне страниц.

## Команды

```bash
# Frontend (React 18 + Vite, порт 5173, dev-прокси /api → :3001)
cd anime-site && npm run dev
cd anime-site && npm run build

# Backend (NestJS, порт 3001, глобальный префикс /api)
cd server && npm run dev          # nest start --watch (НЕ start:dev — такого скрипта нет)
cd server && npm run build
```

Тестов и линтера в проекте нет. Проверка = ручной прогон в браузере + успешная сборка обоих пакетов.

## Архитектура

### Backend (`server/src/`)

- **17 модулей**, каждый в своей папке: auth, users, bookmarks, ratings (вкл. OP/ED-рейтинги `OpeningRating`), comments, progress, friends, uploads, notifications, suggestions, watch-rooms, chats, admin (+ audit-log), quiz (эмодзи-квиз через DeepSeek API), push (web-push), search-history, issues (баг-репорты)
- Структура модуля: `<name>.module.ts` / `.controller.ts` / `.service.ts` / `.entity.ts` / `dto.ts`
- **БД**: TypeORM `type: 'sqljs'` (SQLite на WebAssembly), файл `server/data/qik-anime.db`, `autoSave: true`, `synchronize: true` — миграций НЕТ, схема генерируется из entity при старте. Добавление колонок безопасно; удаление/переименование — в dev удалить файл БД вручную
- **sql.js не поддерживает настоящие транзакции** — избегать многошаговой атомарности (паттерн «сначала пишем, потом чистим при ошибке», см. `CommentsService.toggleLike`)
- **No native dependencies** (должно собираться без Visual Studio Build Tools): `sql.js` вместо `better-sqlite3`, `bcryptjs` вместо `bcrypt`
- **Auth**: Passport JWT (токен 30 дней, на фронте в `localStorage.qik_token`). Guards: `CompositeAuthGuard` (основной — JWT ИЛИ server-to-server API-токен из таблицы `api_tokens`), `OptionalJwtAuthGuard` (гости → `req.user = null`), `AdminGuard`, `MasterOrAdminGuard` (комнаты, баг-трекер). Пользователь в контроллере — через `@CurrentUser()`
- **Роли**: user → master (модерация комментариев, комнаты) → admin (админка, статистика, назначение мастеров)
- Валидация только через DTO + `class-validator` (глобальный `ValidationPipe` с `whitelist: true`)
- Пути (`DB_PATH`, `UPLOAD_DIR_ABSOLUTE`) — только через `common/runtime-paths.ts`, не хардкодить

### Frontend (`anime-site/src/`)

- Страницы в `pages/`, переиспользуемые компоненты в `components/`; PascalCase для компонентов, camelCase для утилит/хуков
- **Все стили в одном файле `styles/index.css`** (~3000+ строк). Никаких CSS-модулей и отдельных файлов. CSS-переменные дизайн-системы: `--surface`, `--surface-secondary`, `--text`, `--text-secondary`, `--accent`, `--accent-secondary`. Светлая тема — селектор `[data-theme='light']`
- **Без Redux**: глобальный стейт — React Context (`AuthContext`, `ThemeContext`), fetch — хук `useApi`
- **Никаких fetch в компонентах** — только через функции `api/backend.js` и `api/client.js`
- Иконки — inline SVG в `components/icons.jsx`, иконочные библиотеки не подключать
- Модалки (`AuthModal`, `SuggestModal`, dropdown `BookmarkButton`), `Toast`, `Lightbox` — через `ReactDOM.createPortal`
- Видео: HLS.js для `.m3u8` стримов AniLibria

### Ключевые паттерны

- **Геймификация**: XP вычисляется из активности на лету (не хранится), уровни по формуле `100 * (n-1)^1.5`
- **Постеры**: `static.yani.tv` заблокирован в РФ → `fixUrl()` подменяет домен на `imgproxy.yani.tv`
- **Watch rooms**: Socket.IO namespace `/watch-rooms`, auth по JWT. Синхронизация: host → `PATCH /api/watch-rooms/:id/state` → WebSocket broadcast `room:state` → viewer применяет. Fallback — HTTP polling. `<video>` всегда в DOM, overlay когда нет URL
- Комнаты доступны только мастерам/админам — это фича, не баг

## Деплой (ВАЖНО)

**Пуш в `main` = автодеплой в прод** (GitHub Actions → rsync на VPS → PM2 `anime-api` + nginx, quickik.ru). Не пушить без явной команды пользователя.

- `server/data/` (БД) и `server/uploads/` исключены из rsync — не трогать
- `.env` существует только на сервере (`/root/qik-anime/server/.env`): `PORT`, `JWT_SECRET`, `DB_PATH`, `UPLOAD_DIR`, `CORS_ORIGINS`, `ADMIN_SECRET`, `DEEPSEEK_TOKEN`
- Полный runbook (что ломается и как чинить, ручной деплой, бэкапы БД) — в `AGENTS.md`

## Рабочий процесс

- **context_log**: на каждое изменение кода создавать файл `context_log/YYYY-MM-DD_HH-MM_<slug>.md` с кратким описанием правок
- **STATE.md**: при значимых изменениях (новая фича, новое ограничение) обновлять краткое текущее состояние проекта в `STATE.md` (без истории — история в git и context_log)
- Коммиты на русском, формат `<глагол> <что сделано>` (например: «добавил комнаты», «фиксы друзей»)
- Библиотеки/фреймворки/API — документацию брать через Context7 MCP (`resolve-library-id` → `query-docs`), не из памяти и не через WebSearch

## Другие доки

- `AGENTS.md` — деплой-runbook, GitHub Secrets, конвенции
- `RULES.md` — детальные правила кода
- `ARCHITECTURE.md` — диаграммы, схема БД, список модулей и guards
- `STATE.md` — краткое текущее состояние проекта (поддерживать актуальным)
