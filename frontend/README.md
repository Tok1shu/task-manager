# Task Manager: фронтенд

React 19 + TypeScript + Vite, Tailwind CSS 4 (цветовая схема из LRP), TanStack Query, react-router, Zustand.
Правила кода и структуры — [CLAUDE.md](CLAUDE.md). Контракт API — [../backend/ROUTES.md](../backend/ROUTES.md).

## Запуск

```bash
npm install
npm run dev        # http://localhost:5173, эмулятор бэкенда включён
```

Демо-пользователи эмулятора (пароль `password123`): `ivan` (владелец проекта «Дипломная работа»), `petr`, `anna`.
У `petr` есть проект «Личные заметки Петра», которого `ivan` и `anna` не видят.

## Эмулятор бэкенда

Пока Django-бэкенд не готов, `/api/*` отвечает Vite-middleware из `mock/`: он реализует контракт из `ROUTES.md` вместе с правилами доступа
(чужой проект — 404, нет права — 403), пагинацией, фильтрами, статистикой и refresh-cookie. Данные хранятся в памяти и сбрасываются при перезапуске.
Код фронтенда про эмуляцию ничего не знает: это обычные HTTP-запросы, видны во вкладке Network.

Когда бэкенд заработает: `MOCK_API=0 API_PROXY_TARGET=http://localhost:8000 npm run dev`.

## Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | dev-сервер с эмулятором (или с прокси на бэкенд, см. выше) |
| `npm run check` | typecheck + lint (oxlint) + тесты (Vitest) + сборка; должен быть зелёным перед коммитом |
| `npm test` | только тесты |
| `npm run build` | продакшн-сборка в `dist/` |
