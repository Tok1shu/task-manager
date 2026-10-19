# Журнал источников и использование ИИ

Данный документ фиксирует внешние источники информации, изученные материалы, а также прозрачно отражает использование инструментов искусственного интеллекта в процессе разработки проекта.

---

## 🔍 Прозрачность и идентификация авторства в Git

Для обеспечения академической честности и прозрачности:
* Любой коммит, в подготовке или генерации которого участвовал автономный ИИ-агент, помечается в сообщении коммита соавтором:
  ```text
  Co-authored-by: Zyabra <agent@lazurite.cc>
  ```
* Коммиты **без** этого соавтора написаны и зафиксированы автором вручную.
* Код, относящийся к темам уроков ITSTEP (см. таблицу ниже), разрабатывается автором проекта самостоятельно.
* То, чего в уроках нет (Docker, JWT-сессии с refresh-cookie, фронтенд на React, документация), делается с помощью ИИ и помечается трейлером выше.

## 📖 Граница: что есть в курсе ITSTEP, а чего нет

Источник — [fullt1lt/CoursesPython](https://github.com/fullt1lt/CoursesPython) (проверено 2026-10-19). «Есть» — тема разобрана в лекции, пишется вручную. «Нет» или «только упомянуто» — можно делать с ИИ.

| Тема | В курсе | Где |
|---|---|---|
| Виртуальное окружение, `pip`, `requirements.txt` | есть | lesson20 |
| Django: проект, приложения, шаблоны, `settings`/`urls` | есть | lesson22, 23 |
| Модели, связи, PostgreSQL (`psycopg`), `Meta`, ограничения | есть | lesson24 |
| ORM: `QuerySet`, `Q`, `annotate`/`aggregate`, `select_related`, транзакции | есть | lesson25 |
| Формы, `AbstractUser`, `UserCreationForm`, `authenticate`/`login`, `@login_required` | есть | lesson26 |
| CBV, `LoginView`, пагинация | есть | lesson27 |
| Сессии, куки, кеш | есть | lesson28 |
| Middleware, signals, messages | есть | lesson29 |
| DRF: сериализаторы, `APIView`, `ViewSet`, роутеры, пагинация | есть | lesson30, 31 |
| DRF: `permissions`, `django-filter`, поиск и сортировка | есть | lesson32 |
| Тесты Django и DRF: `TestCase`, `APIClient`, `FactoryBoy` | есть | lesson15, 33 |
| JWT | только базовая настройка `simplejwt` (`token/`, `token/refresh/`), ~60 строк | lesson32 |
| Ротация refresh, чёрный список, `HttpOnly`-cookie, throttling | нет | — |
| Docker, `docker compose` | нет (одна команда для Redis) | lesson28 |
| `.env`, `django-environ` / `python-dotenv`, gunicorn, nginx как прокси | нет | — |
| CORS, OpenAPI/Swagger | нет | — |
| React / Vue | только упоминание | lesson22, 30, 31 |

Условия ТЗ ([TASK.md](TASK.md)) разрешают ИИ для HTML/CSS/JS; расширение на остальные темы вне уроков — решение автора проекта, согласуется с преподавателем.

---

## 🛠 Задействованные инструменты ИИ

1. **Gemini 3.8 Flash (Zyabra / Antigravity Agent):**
   * **Роль:** Менеджмент репозитория и проектная автоматизация.
   * **Область применения:** Первичная инициализация репозитория, автоматизированная настройка цветовых тегов (labels) и декомпозиция ТЗ на 14 задач (GitHub Issues) через GitHub CLI (`gh`).

2. **Anthropic Claude:**
   * **Роль:** Архитектурный консультант.
   * **Область применения:** Советы и рекомендации по переносу паттернов гексагональной архитектуры (Ports & Adapters / Clean Architecture) с Java (Spring Boot) на идиоматичный Python (`typing.Protocol`, `dataclasses`, разделение Domain/Application/Adapters).

---

## 📅 Хронологический журнал источников и запросов

Формат ведения записей:
* **Дата (`YYYY-MM-DD`)**
  * **🤖 ИИ-ассистенты:** инструмент, задача/запрос, примененный результат.
  * **📚 Документация и статьи:** ссылки на документацию, гайды, StackOverflow.

---

### [2026-10-11]
#### 🤖 ИИ-ассистенты
* **Инструмент:** Gemini 3.8 Flash
  * **Задача:** Декомпозиция официального ТЗ дипломного проекта (`Task_Manager_TZ.md`), генерация структуры меток и тикетов в GitHub Issues.
  * **Результат:** Сформирован репозиторий [Tok1shu/task-manager](https://github.com/Tok1shu/task-manager), создано 18 категорий меток и 14 issues с чек-листами требований.
* **Инструмент:** Claude
  * **Задача:** Консультация по концептуальному переносу гексагональной архитектуры (Hexagonal / Ports & Adapters) из Spring Boot в Python/Django без оверинжиниринга.
  * **Результат:** Сформировано понимание контрактов через `typing.Protocol` (duck-typing) вместо тяжелого DI и отделение доменных сущностей от Active Record Django ORM.

#### 📚 Документация и материалы
* Официальное ТЗ дипломного проекта: [TASK.md](TASK.md) (STEP IT ACADEMY Praha).
* Python `typing.Protocol` — [Structural Subtyping (PEP 544)](https://peps.python.org/pep-0544/).

### [2026-10-19]
#### 🤖 ИИ-ассистенты
* **Инструмент:** Zyabra (Claude Code)
  * **Задача:** Отказ от гексагональной архитектуры в пользу Package by feature; правка `README.md`; переработка issue [#1](https://github.com/Tok1shu/task-manager/issues/1); создание ветки `feat/backend`.
  * **Результат:** Обновлены `README.md` и `SOURCES.md`, issue #1 переименован в «Структура проекта по принципу Package by feature».

* **Инструмент:** Zyabra (Claude Code)
  * **Задача:** Проектирование контракта API (`backend/ROUTES.md`), Docker-инфраструктура (корневой `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`), правила фронтенда (`frontend/CLAUDE.md`), таблица границ ИИ.
  * **Результат:** Документы и конфигурация без кода приложения; принципы структуры фронтенда взяты из собственного проекта автора (LRP): package by feature, слои `app → features → shared`, запросы только через api-модули и хуки.

#### 📚 Документация и материалы
* Курс лекций по Python и Django, по которому строится проект: [fullt1lt/CoursesPython](https://github.com/fullt1lt/CoursesPython) — виртуальные окружения и `pip` ([lesson20](https://github.com/fullt1lt/CoursesPython/blob/main/lesson20.md)), `django-admin startproject` / `startapp` ([lesson22](https://github.com/fullt1lt/CoursesPython/blob/main/lesson22.md)), подключение PostgreSQL через `psycopg` ([lesson24](https://github.com/fullt1lt/CoursesPython/blob/main/lesson24.md)).
