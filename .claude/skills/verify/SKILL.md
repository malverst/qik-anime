---
name: verify
description: Как собрать, запустить и проверить QIK Anime после изменений фронтенда (вкл. FSD-миграцию)
---

# Верификация QIK Anime

## Сборка (главный автомат-чек)

```bash
cd anime-site && npm run build   # полный резолв графа модулей, вкл. @fsd/@legacy алиасы
```

Деплой гоняет именно это — красный build = сломанный деплой. Предупреждение про chunk RoomWatch >500kB — норма, не ошибка.

## Запуск

```bash
cd anime-site && npm run dev     # Vite на :5173, прокси /api → :3001
cd server && npm run dev         # бэкенд (опционален: без него фронт работает в гостевом режиме)
```

Vite печатает ошибки резолва/трансформации в свой stdout при реальных запросах страниц — после прогона обязательно читать лог dev-сервера, чистый лог = модули трансформируются.

## Проверка модулей dev-сервера

curl ломается на кириллице в /@fs/-путях (exit 3) — использовать node fetch:

```bash
node -e "fetch('http://localhost:5173/src/App.jsx').then(r=>r.text()).then(console.log)"
```

- Перенесённые в apps/frontend модули видны как `/@fs/C:/.../apps/frontend/src/...` (нужен `server.fs.allow` — уже настроен)
- `@legacy`-импорты резолвятся в root-относительные `/src/...`
- react/react-router из `/node_modules/.vite/deps/` (это `resolve.dedupe`)
- Несуществующие пути отдают 200 с index.html (SPA-fallback) — проверять тело ответа, не только статус

## Скриншоты (пиксели)

```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu \
  --screenshot="C:\Users\malve\AppData\Local\Temp\shot.png" --window-size=1280,2000 \
  --hide-scrollbars --virtual-time-budget=9000 http://localhost:5173/
```

Гочи этой машины:
- `--dump-dom` и `--print-to-pdf` у этого Chrome МОЛЧА не пишут вывод (exit 0, 0 байт) — не тратить время, работает только `--screenshot`
- Read-инструмент не отображает картинки в этой среде («Unsupported Image») — эвристика: PNG заметного размера (мегабайты на 1280x2000) = отрендерился контент; почти пустая страница сжалась бы в десятки КБ
- Уменьшить/сконвертировать: PowerShell System.Drawing скриптом через `-File` (инлайн `-Command` ломается: bash съедает `$`)
- Мобильный вьюпорт: `--window-size=390,844` (нижний навбар рендерит Header)
