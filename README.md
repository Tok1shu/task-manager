# Task Manager

Веб-приложение для управления проектами и задачами (Дипломный проект STEP IT Academy Prague).

## Стек технологий
- **Backend:** Python 3, Django 6, Django REST Framework, SimpleJWT
- **Структура проекта:** Package by feature — код сгруппирован по предметным областям (`accounts`, `projects`, `tasks`, `comments`), а не по техническим слоям
- **База данных:** PostgreSQL (в Docker) / SQLite (для легковесного локального тестирования)
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand
- **Контроль версий и окружение:** Git, Docker, Docker Compose

## Структура репозитория
```text
backend/     Django REST API (manage.py, конфигурация, фичи accounts, projects, tasks, comments)
frontend/    Клиентское SPA-приложение (React, Vite, Tailwind)
TASK.md      Техническое задание
SOURCES.md   Журнал источников и использования ИИ
```

Каждая фича на бэкенде — отдельное Django-приложение со своими моделями, представлениями, сериализаторами и тестами.

## Документация
- Подробные требования и спецификация проекта: [TASK.md](TASK.md).
- Контракт и описание API: [backend/ROUTES.md](backend/ROUTES.md).
- Интерактивная документация Swagger / OpenAPI: `http://localhost:8000/api/docs/`.
- Источники и учёт использования ИИ: [SOURCES.md](SOURCES.md).
- Руководство по фронтенду: [frontend/CLAUDE.md](frontend/CLAUDE.md).

## Быстрый запуск через Docker
```bash
cp .env.example .env                         # скопировать настройки окружения
docker compose --profile frontend up --build # запуск всего стека: PostgreSQL + Django API + React
```
После запуска:
- Frontend: `http://localhost:5173`
- Backend API & Swagger: `http://localhost:8000/api/docs/`
- Django Admin: `http://localhost:8000/admin/`

## Локальный запуск (без Docker)

### 1. Бэкенд
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### 2. Фронтенд
```bash
cd frontend
npm install
npm run dev
```

## Тестирование
Проект полностью покрыт автоматическими тестами.

### Тесты бэкенда (47 тестов)
Тестируются модели, валидаторы, сериализаторы, права доступа и API-эндпоинты:
```bash
cd backend
python manage.py test accounts projects tasks comments
```

### Тесты фронтенда (17 тестов)
Тестируются HTTP-клиент, авторизация, роутинг, сторы и компоненты:
```bash
cd frontend
npm test
```
