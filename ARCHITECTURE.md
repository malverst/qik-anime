# ARCHITECTURE.md

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (React SPA)                   │
│  anime-site/ (Vite, port 5173 dev, static build prod)   │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐    │
│  │  Pages   │  │Components│  │ Contexts (Auth,     │    │
│  │ (18 pgs) │  │  (23)    │  │ Theme)              │    │
│  └──────────┘  └──────────┘  └────────────────────┘    │
│       │              │              │                    │
│  ┌────┴──────────────┴──────────────┴───────────────┐  │
│  │              api/ (HTTP clients)                  │  │
│  │  client.js → YummyAnime API                      │  │
│  │  backend.js → NestJS Backend                      │  │
│  │  socket.io-client → NestJS WebSocket Gateways     │  │
│  └──────────────────────────────────────────────────┘  │
└──────────┬──────────────────────┬──────────────────────┘
           │ HTTP                 │ HTTP + WS
           ▼                      ▼
┌──────────────────┐  ┌──────────────────────────────────┐
│  YummyAnime API  │  │     NestJS Backend (:3001)        │
│  api.yani.tv     │  │  server/ (Express, /api prefix)   │
│                  │  │                                    │
│  • Каталог аниме │  │  ┌────────────────────────────┐  │
│  • Видео/серии   │  │  │  Modules (17)              │  │
│  • Поиск         │  │  │  Auth, Users, Bookmarks,   │  │
│  • Расписание    │  │  │  Ratings, Comments,        │  │
│  • Рекомендации  │  │  │  Progress, Friends,        │  │
│  • Новости/фид   │  │  │  Notifications, Uploads,   │  │
│                  │  │  │  Suggestions, WatchRooms,  │  │
│                  │  │  │  Chats, Admin, Quiz, Push, │  │
│                  │  │  │  SearchHistory, Issues     │  │
│                  │  │  └──────────┬─────────────────┘  │
│                  │  │             │                      │
│                  │  │  ┌──────────▼─────────────────┐  │
│                  │  │  │  TypeORM + sql.js (SQLite) │  │
│                  │  │  │  data/qik-anime.db         │  │
│                  │  │  └────────────────────────────┘  │
└──────────────────┘  └──────────────────────────────────┘
```

## Data Flow

### Получение аниме
1. Фронтенд → `api/client.js` → YummyAnime API (`api.yani.tv`)
2. Параллельно: фронтенд → `api/backend.js` → NestJS (для получения пользовательских данных: закладки, рейтинг, прогресс)
3. Данные сливаются на уровне страницы

### Авторизация
1. `POST /api/auth/login` или `POST /api/auth/register` → JWT токен (30 дней)
2. Токен хранится в `localStorage` под ключом `qik_token`
3. Все защищённые запросы: `Authorization: Bearer <token>`
4. Server-to-server запросы: API-токен (таблица `api_tokens`), принимается `CompositeAuthGuard` наравне с JWT

### Watch Room (комнаты совместного просмотра)
1. Создание: `POST /api/watch-rooms` → возвращает код комнаты (только мастера/админы)
2. Подключение: Socket.IO в namespace `/watch-rooms` (path `/api/socket.io`), аутентификация по JWT
3. Клиент шлёт `room:join { roomId }` → сервер рассылает состояние
4. Синхронизация видео: `PATCH /api/watch-rooms/:id/state` → WebSocket broadcast
5. Чат: `POST /api/watch-rooms/:id/messages` → WebSocket broadcast
6. Fallback: HTTP polling `GET /api/watch-rooms/:id/sync`

### Личные чаты
1. REST: `/api/chats` (список, сообщения) под `CompositeAuthGuard`
2. Realtime: Socket.IO namespace `/chat` (path `/api/socket.io`)
3. Уведомления о новых сообщениях — тип `chat_message`

### Квиз
- `GET /api/quiz/question` — угадай аниме по кадрам
- `GET /api/quiz/emoji` — угадай аниме по эмодзи (генерация через DeepSeek API, токен `DEEPSEEK_TOKEN`)
- Пул аниме собирается из YummyAnime случайными страницами с разными сортировками, сиквелы отфильтровываются

## Database Schema

### Таблицы (SQLite через TypeORM)

| Таблица | Назначение |
|---------|------------|
| `users` | Пользователи (email, username, пароль, аватар, баннер, роль user/master/admin) |
| `bookmarks` | Закладки аниме (статус: watching/planned/completed/on_hold/dropped/rewatching/favorite) |
| `ratings` | Оценки аниме (1-10) |
| `opening_ratings` | Оценки опенингов/эндингов (уникальный индекс user+animeId+type) |
| `comments` | Комментарии к аниме и профилям, с лайками |
| `comment_likes` | Лайки комментариев |
| `watch_progress` | Прогресс просмотра (серия, секунда, продолжительность) |
| `friendships` | Дружеские связи (pending/accepted) |
| `notifications` | Уведомления (friend_request, friend_accept, anime_suggestion, comment_reply, room_invite, chat_message, system) |
| `watch_rooms` | Комнаты совместного просмотра (код, владелец, состояние плеера) |
| `watch_room_participants` | Участники комнат |
| `watch_room_messages` | Сообщения чата комнат |
| `chats` | Личные чаты (пары пользователей) |
| `chat_messages` | Сообщения личных чатов |
| `push_subscriptions` | Подписки web-push (VAPID) |
| `search_history` | История поиска пользователя |
| `audit_logs` | Аудит-лог действий в админке |
| `issues` | Баг-репорты (страница/блок, статус, исполнитель) |
| `issue_attachments` | Вложения баг-репортов |
| `api_tokens` | Server-to-server API-токены |

XP и уровни пользователей в БД не хранятся — вычисляются на лету из активности (`common/gamification.ts`, уровень n требует `100 * (n-1)^1.5` XP).

## Module Boundaries

### Backend Modules

```
AppModule
├── ConfigModule      (глобальный .env)
├── TypeOrmModule     (SQLite через sql.js, synchronize: true)
├── ServeStaticModule (раздача uploads/ на /uploads)
├── AuthModule        (регистрация, вход, JWT, API-токены)
├── UsersModule       (профили, поиск, статистика, XP/уровни)
├── BookmarksModule   (закладки аниме)
├── RatingsModule     (рейтинги аниме 1-10 + рейтинги OP/ED)
├── CommentsModule    (комментарии + лайки)
├── ProgressModule    (прогресс просмотра)
├── FriendsModule     (друзья)
├── NotificationsModule (уведомления)
├── UploadsModule     (загрузка изображений)
├── SuggestionsModule (предложения аниме друзьям)
├── WatchRoomsModule  (комнаты просмотра + WS gateway /watch-rooms)
├── ChatsModule       (личные чаты + WS gateway /chat)
├── AdminModule       (админка, статистика, аудит-лог)
├── QuizModule        (квиз по кадрам и эмодзи, DeepSeek API)
├── PushModule        (web-push уведомления)
├── SearchHistoryModule (история поиска)
└── IssuesModule      (баг-репорты, только мастера/админы)
```

Каждый модуль содержит: `.module.ts`, `.controller.ts`, `.service.ts`, `.entity.ts` (если есть сущность), `dto.ts` (если есть DTO).

### Auth Guards
- `JwtAuthGuard` — строгая JWT-аутентификация (401 без токена)
- `OptionalJwtAuthGuard` — мягкая аутентификация (req.user = null для гостей)
- `ApiTokenGuard` — аутентификация по server-to-server API-токену
- `CompositeAuthGuard` — JWT ИЛИ API-токен; основной guard на защищённых роутах
- `AdminGuard` — только админы
- `MasterOrAdminGuard` — мастера и админы (WatchRooms, Issues)

### Frontend

- Страницы (`pages/`): Home, Catalog, Schedule, SearchPage, Library, Settings, Friends, Chats, Rooms, RoomWatch, Profile (`/u/:id`), AnimeDetail, Watch, Admin, Quiz, Issues, Ratings, NotFound
- Глобальный стейт: `AuthContext`, `ThemeContext`; fetch через хук `useApi`
- Плеер: утилиты в `utils/` (`kodikPlayer.js`, `playerApi.js`, `frames.js`), HLS.js для `.m3u8` стримов

## Environment Variables

### Server (.env)
```
PORT=3001
JWT_SECRET=qik-anime-dev-secret-change-me
APP_ROOT=
DB_PATH=data/qik-anime.db
UPLOAD_DIR=uploads
CORS_ORIGINS=
ADMIN_SECRET=
DEEPSEEK_TOKEN=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

### Frontend (.env)
```
VITE_YUMMY_APP_TOKEN=
VITE_YUMMY_PRIVATE_TOKEN=
VITE_QIK_API_URL=
```
