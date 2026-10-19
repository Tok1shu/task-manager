# Task Manager

Веб-приложение для управления проектами и задачами (Дипломный проект STEP IT Academy Prague).

## Стек технологий
- **Backend:** Python, Django
- **Структура проекта:** Package by feature — код сгруппирован по предметным областям (`accounts`, `projects`, `tasks`, `comments`), а не по техническим слоям
- **База данных:** PostgreSQL
- **Интерфейс:** Django Templates, HTML5, CSS3, JavaScript
- **Контроль версий:** Git / GitHub

## Структура репозитория
```text
backend/     Django-проект (manage.py, конфигурация, приложения-фичи)
frontend/    Статика и шаблоны интерфейса
TASK.md      Техническое задание
SOURCES.md   Журнал источников и использования ИИ
```

Каждая фича — отдельное Django-приложение со своими моделями, представлениями, формами, шаблонами и тестами.

## Документация
Подробные требования и спецификация проекта доступны в файле [TASK.md](TASK.md).
Источники и учёт использования ИИ — в файле [SOURCES.md](SOURCES.md).

## Запуск через Docker
```bash
cp .env.example .env          # заполнить значения
docker compose up --build     # PostgreSQL + backend на http://localhost:8000
docker compose --profile frontend up --build   # плюс фронтенд на http://localhost:5173 (когда он создан)
```
Контракт API — [backend/ROUTES.md](backend/ROUTES.md). Правила для фронтенда — [frontend/CLAUDE.md](frontend/CLAUDE.md).
