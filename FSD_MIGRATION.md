# План миграции фронтенда на FSD

Живой документ: отмечать чекбоксы по мере переноса, дописывать волны по ходу. Прод не должен ломаться ни на одном шаге.

## Механика переноса (обкатана на Header/Footer)

1. `mv` файла в целевой слой `apps/frontend/src/...` (слайсы слоёв widgets/features/entities — с сегментом `ui/` и публичным `index.js`; в `shared/` слайсов нет — кладём файлы в сегменты `api/`, `ui/`, `lib/` без баррелей)
2. Правка импортов по всему коду: `anime-site` тянет перенесённое через `@fsd/...`, перенесённые модули тянут ещё не перенесённое через `@legacy/...`
3. Алиасы и матчасть живут в `anime-site/vite.config.js`: `@fsd`, `@legacy`, `resolve.dedupe` (react и ко для файлов вне корня), `server.fs.allow`
4. **После каждой волны — верификация** по `.claude/skills/verify/SKILL.md`: `npm run build`, dev-сервер + проверка модулей, скриншоты, чистый vite-лог. Затем context_log и отметка здесь.
5. Удалять пустые папки и `.gitkeep` заполнившихся слоёв

## Волна 0 — каркас и первые виджеты ✅ (2026-07-19)

- [x] Каркас слоёв `apps/frontend/src/{app,pages,widgets,features,entities,shared}`
- [x] Алиасы `@fsd`/`@legacy` + dedupe + fs.allow
- [x] `Header.jsx` → `widgets/header`
- [x] `Footer.jsx` → `widgets/footer`

## Волна 1 — фундамент shared/ (нулевые зависимости) ✅ (2026-07-19)

- [x] `api/client.js` → `shared/api/client.js`
- [x] `api/backend.js` → `shared/api/backend.js`
- [x] `hooks/useApi.js` → `shared/lib/useApi.js`
- [x] `utils/time.js` → `shared/lib/time.js`
- [x] `utils/frames.js` → `shared/lib/frames.js`
- [x] `utils/playerApi.js` → `shared/lib/playerApi.js`
- [x] `utils/kodikPlayer.js` → `shared/lib/kodikPlayer.js`
- [x] `components/icons.jsx` → `shared/ui/icons.jsx`
- [x] `components/Section.jsx` → `shared/ui/Section.jsx`
- [x] `components/Lightbox.jsx` → `shared/ui/Lightbox.jsx`
- [x] `components/SEO.jsx` → `shared/ui/SEO.jsx`
- [x] `components/GlassSurface.jsx` + `GlassSurface.css` → `shared/ui/`
- [x] В перенесённом `widgets/header` заменить `@legacy`-импорты icons/backend/client на `@fsd/shared/...` (3 из 7 @legacy ушли)

## Волна 2 — одна ступень зависимостей (чистые после волны 1) ✅ (2026-07-19)

- [x] `components/Carousel.jsx` → `shared/ui/Carousel.jsx` (зависит от icons)
- [x] `components/Avatar.jsx` → `entities/user` (backend, frames, time)
- [x] `context/ThemeContext.jsx` → `app/providers`
- [x] `components/GlassNav.jsx` → `widgets/glass-nav` (зависит от GlassSurface)
- `motion` добавлен в `resolve.dedupe` (GlassNav его использует)
- **Header.jsx: 0 `@legacy`** — весь граф зависимостей в FSD-слоях

## Волна 3 — авторизация ✅ (2026-07-19)

- [x] `context/AuthContext.jsx` → `app/providers` (в нём же тосты, web-push, XP)
- [x] `components/Toast.jsx` → `shared/ui` (зависит от AuthContext → @fsd/app/providers)
- [x] `components/AuthModal.jsx` → `features/auth` (AuthContext + icons)
- [x] `components/NotificationBell.jsx` → `widgets/notification-bell` (backend, Avatar, icons, AuthContext)
- [x] `anime-site/src/context/` → пуст (оба контекста в app/providers)

## Волна 4 — фичи страницы аниме ✅ (2026-07-19)

- [x] `BookmarkButton` → `features/bookmark` (вкл. именованный `statusLabel`)
- [x] `RatingWidget` → `features/rate-anime`
- [x] `OpeningRatingWidget` → `features/rate-opening`
- [x] `SuggestModal` → `features/suggest-anime`
- [x] `QuizEmoji`, `QuizFrames` → `features/quiz` (2 файла в одном слайсе; решено: features)
- [x] `Comments` → `widgets/comments`
- [x] `ContinueWatching` → `widgets/continue-watching`
- [x] `Hero` → `widgets/hero`
- [x] `anime-site/src/components/` — пуст

## Волна 5 — страницы ✅ (2026-07-19)

- [x] Все 18 страниц в `apps/frontend/src/pages/*` (каждая в своей папке с barrel-export)
- [x] `AnimeCard` → `entities/anime` (вкл. `CardSkeleton`)
- [x] `App.jsx` импорты переписаны (лайзи-импорты тоже)
- [x] Кросс-импортов между страницами нет
- [x] `resolve.dedupe`: +socket.io-client, +hls.js, +react-helmet-async
- [x] `anime-site/src/pages/` — пуст
- [x] `anime-site/src/components/` — пуст (подчищены дубликаты wave1)

## Волна 6 — финал: шелл приложения ✅ (2026-07-19)

- [x] `App.jsx` → `apps/frontend/src/app/App.jsx`, `main.jsx` → `apps/frontend/src/main.jsx`
- [x] `styles/index.css` → `apps/frontend/src/app/styles/index.css`
- [x] `index.html`, `package.json` → `apps/frontend/`
- [x] Новый `vite.config.js` без `@legacy`, без `server.fs.allow`, `@fsd` → `./src`
- [x] `npm install` + build из `apps/frontend/` (553 модуля)
- [x] `anime-site/src/` — полностью пуст
- [x] Удалить `anime-site/` целиком
- [x] Обновить CI-деплой (`.github/workflows/deploy.yml`) — все пути `anime-site` → `apps/frontend`
- [x] Обновить `CLAUDE.md` и `AGENTS.md` — команды, пути, конвенции
- [x] `scripts/generate-sitemap.mjs` восстановлен в `apps/frontend/scripts/`
