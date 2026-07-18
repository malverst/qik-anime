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

## FSD-структура фронтенда (apps/frontend)

Фронтенд поэтапно мигрирует из `anime-site/` в `apps/frontend/` на [Feature-Sliced Design](https://feature-sliced.design). Статус: создан каркас слоёв, код пока живёт в `anime-site/`. Слой `processes` не используется (deprecated в FSD 2.0).

### Слои (`apps/frontend/src/`)

**`app/`** — инициализация приложения. Не содержит бизнес-логики.
- `app/providers/` — провайдеры контекстов (`AuthContext`, `ThemeContext`)
- `app/router/` — роутер и список маршрутов (сейчас внутри `App.jsx`)
- `app/styles/` — глобальные стили (`index.css` переезжает сюда целиком; в перспективе стили переводятся на Tailwind, распил чистого CSS по слайсам не планируется)
- точка входа `main.jsx`, корневой `App`

**`pages/`** — по слайсу на маршрут: `home`, `catalog`, `schedule`, `search`, `library`, `settings`, `friends`, `chats`, `rooms`, `room-watch`, `profile`, `anime-detail`, `watch`, `admin`, `quiz`, `issues`, `ratings`, `not-found`. Страница только собирает виджеты и фичи + разметка лейаута; бизнес-логики по минимуму.

**`widgets/`** — крупные самостоятельные блоки, переиспользуемые между страницами или составляющие заметную часть страницы: шапка, нижний навбар, футер, секция комментариев, «продолжить просмотр», хиро-баннер, колокольчик уведомлений.

**`features/`** — интерактивные пользовательские сценарии («что юзер делает»): авторизация, добавление в закладки, оценка аниме, оценка OP/ED, предложение аниме другу, переключение темы, подписка на push.

**`entities/`** — бизнес-сущности: данные + их отображение, без пользовательских сценариев. Кандидаты: `anime` (карточка, типы, работа с постерами), `user` (аватар, мини-карточка), `comment`, `notification`.

**`shared/`** — код без привязки к бизнес-домену:
- `shared/api/` — HTTP-клиенты (`backend.js`, `client.js`), socket.io-клиент
- `shared/ui/` — UI-примитивы без бизнес-смысла: иконки, Toast, Lightbox, Carousel, Section, GlassSurface, SEO
- `shared/lib/` — хуки (`useApi`) и утилиты (`time.js`, `frames.js`, `playerApi.js`, `kodikPlayer.js`)
- `shared/config/` — константы, доступ к env

### Правила импортов

1. Только сверху вниз: `app → pages → widgets → features → entities → shared`. Нижний слой ничего не знает о верхних.
2. Слайсы одного слоя не импортируют друг друга.
3. Слайс = папка с сегментами `ui/`, `model/`, `api/`, `lib/` (по необходимости) и публичным API `index.js`. Импорт извне слайса — только через его `index.js`.
4. Имена слайсов — kebab-case.

### Маппинг текущего кода → FSD

| Сейчас (`anime-site/src/`) | Куда |
|---------------------------|------|
| `context/AuthContext.jsx`, `context/ThemeContext.jsx` | `app/providers/` |
| маршруты из `App.jsx` | `app/router/` |
| `styles/index.css` | `app/styles/` |
| `pages/*` (18 шт.) | `pages/<slug>/` |
| `Header`, `GlassNav`, `Footer`, `Hero`, `Comments`, `ContinueWatching`, `NotificationBell` | `widgets/` |
| `AuthModal`, `BookmarkButton`, `RatingWidget`, `OpeningRatingWidget`, `SuggestModal` | `features/` |
| `AnimeCard`, `Avatar` | `entities/` |
| `icons.jsx`, `Toast`, `Lightbox`, `Carousel`, `Section`, `GlassSurface`, `SEO` | `shared/ui/` |
| `api/backend.js`, `api/client.js` | `shared/api/` |
| `hooks/useApi.js`, `utils/*` | `shared/lib/` |
| `QuizEmoji`, `QuizFrames` | решить при переносе (features `quiz-*` или widgets) |

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
