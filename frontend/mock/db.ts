// Эмулятор бэкенда: данные в памяти, сбрасываются при перезапуске dev-сервера.
// Контракт — backend/ROUTES.md. Пароль всех демо-пользователей: password123.
import { randomUUID } from "node:crypto"

export type Status = "todo" | "in_progress" | "done"
export type Priority = "low" | "medium" | "high"

export interface User {
  id: string
  username: string
  email: string
  password: string
  date_joined: string
}
export interface Project {
  id: string
  name: string
  description: string
  ownerId: string
  memberIds: string[]
  created_at: string
}
export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  authorId: string
  assigneeId: string | null
  status: Status
  priority: Priority
  due_date: string | null
  created_at: string
  updated_at: string
}
export interface Comment {
  id: string
  taskId: string
  authorId: string
  text: string
  created_at: string
}

export const db = {
  users: [] as User[],
  projects: [] as Project[],
  tasks: [] as Task[],
  comments: [] as Comment[],
  accessTokens: new Map<string, { userId: string; exp: number }>(),
  refreshTokens: new Map<string, string>(),
}

const DAY = 86_400_000
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString()
const day = (offset: number) => new Date(Date.now() + offset * DAY).toISOString().slice(0, 10)

export function seed() {
  db.users.length = db.projects.length = db.tasks.length = db.comments.length = 0
  db.accessTokens.clear()
  db.refreshTokens.clear()

  const mk = (username: string, email: string, daysAgo: number): User => ({
    id: randomUUID(), username, email, password: "password123", date_joined: ago(daysAgo),
  })
  const ivan = mk("ivan", "ivan@example.com", 30)
  const petr = mk("petr", "petr@example.com", 20)
  const anna = mk("anna", "anna@example.com", 10)
  db.users.push(ivan, petr, anna)

  const diploma: Project = {
    id: randomUUID(), name: "Дипломная работа", ownerId: ivan.id, memberIds: [petr.id, anna.id],
    description: "Task Manager для STEP IT Academy: бэкенд на Django, фронтенд на React.", created_at: ago(14),
  }
  const trip: Project = {
    id: randomUUID(), name: "Поездка в Турцию", ownerId: anna.id, memberIds: [ivan.id],
    description: "Билеты, отель, трансфер и список вещей.", created_at: ago(6),
  }
  const secret: Project = {
    id: randomUUID(), name: "Личные заметки Петра", ownerId: petr.id, memberIds: [],
    description: "Иван и Анна этот проект не видят.", created_at: ago(3),
  }
  db.projects.push(diploma, trip, secret)

  const task = (
    p: Project, title: string, o: Partial<Task> & { authorId: string },
  ): Task => {
    const t: Task = {
      id: randomUUID(), projectId: p.id, title, description: "", assigneeId: null,
      status: "todo", priority: "medium", due_date: null, created_at: ago(5), updated_at: ago(2), ...o,
    }
    db.tasks.push(t)
    return t
  }
  const t1 = task(diploma, "Описать структуру проекта по фичам", {
    authorId: ivan.id, assigneeId: ivan.id, status: "done", priority: "high", due_date: day(-6),
    description: "Package by feature: accounts, projects, tasks, comments.",
  })
  const t2 = task(diploma, "Сделать модель User с UUID", {
    authorId: ivan.id, assigneeId: ivan.id, status: "in_progress", priority: "high", due_date: day(2),
    description: "AbstractUser, уникальный email, UUID через VO. До первой миграции!",
  })
  task(diploma, "Подключить PostgreSQL и .env", {
    authorId: ivan.id, assigneeId: petr.id, status: "todo", priority: "high", due_date: day(-2),
  })
  const t4 = task(diploma, "Написать тесты на права доступа", {
    authorId: petr.id, assigneeId: anna.id, status: "todo", priority: "medium", due_date: day(9),
  })
  task(diploma, "Сверстать страницу входа", {
    authorId: anna.id, assigneeId: anna.id, status: "done", priority: "low", due_date: day(-1),
  })
  task(diploma, "Придумать название проекту", { authorId: petr.id, priority: "low" })
  task(trip, "Купить билеты Прага — Анталья", {
    authorId: anna.id, assigneeId: ivan.id, status: "in_progress", priority: "high", due_date: day(4),
  })
  task(trip, "Забронировать трансфер", { authorId: anna.id, assigneeId: anna.id, due_date: day(12) })
  task(secret, "Секретная задача", { authorId: petr.id, assigneeId: petr.id })

  const comment = (t: Task, author: User, text: string, daysAgo: number) =>
    db.comments.push({ id: randomUUID(), taskId: t.id, authorId: author.id, text, created_at: ago(daysAgo) })
  comment(t1, petr, "Отлично, теперь понятно, куда что класть.", 4)
  comment(t2, anna, "UUID7 не забудь — в Python 3.14 он уже в stdlib.", 2)
  comment(t2, ivan, "Да, делаю через EntityId.", 1)
  comment(t4, ivan, "Не забудь кейс «чужой проект = 404».", 1)
}

seed()
