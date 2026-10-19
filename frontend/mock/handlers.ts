// Обработчики эмулятора по контракту backend/ROUTES.md.
// Правила доступа повторяют серверные: чужой объект = 404, нет права = 403.
import type { IncomingMessage, ServerResponse } from "node:http"
import { randomUUID } from "node:crypto"
import { db, type Comment, type Priority, type Project, type Status, type Task, type User } from "./db.ts"

const PAGE_SIZE = 20
const LATENCY_MS = 150
const ACCESS_TTL_MS = 15 * 60_000
const REFRESH_COOKIE = "refresh_token"
const STATUSES: Status[] = ["todo", "in_progress", "done"]
const PRIORITIES: Priority[] = ["low", "medium", "high"]
const PRIORITY_WEIGHT: Record<Priority, number> = { low: 0, medium: 1, high: 2 }

class HttpError extends Error {
  constructor(public status: number, public body: unknown) {
    super(String(status))
  }
}
const fail = (status: number, detail: string): never => {
  throw new HttpError(status, { detail })
}
const notFound = () => fail(404, "Не найдено.")
const forbidden = () => fail(403, "У вас нет прав на это действие.")
const invalid = (errors: Record<string, string[]>): never => {
  throw new HttpError(400, errors)
}

interface Ctx {
  params: Record<string, string>
  query: URLSearchParams
  body: Record<string, unknown>
  cookies: Record<string, string>
  setCookie: string[]
  user: User | null
}
interface Result {
  status: number
  body?: unknown
}
type Handler = (ctx: Ctx) => Result
interface Route {
  method: string
  regex: RegExp
  names: string[]
  handler: Handler
  public: boolean
}

const routes: Route[] = []
function route(method: string, pattern: string, handler: Handler, opts: { public?: boolean } = {}) {
  const names: string[] = []
  const regex = new RegExp(
    "^" + pattern.replace(/:(\w+)/g, (_, n: string) => (names.push(n), "([^/]+)")) + "$",
  )
  routes.push({ method, regex, names, handler, public: opts.public ?? false })
}

// ───────────────────────── Сериализация ─────────────────────────

const userById = (id: string) => db.users.find((u) => u.id === id)
const userRef = (id: string | null) => {
  const u = id ? userById(id) : undefined
  return u ? { id: u.id, username: u.username } : null
}
const isOwner = (p: Project, u: User) => p.ownerId === u.id
const isMember = (p: Project, u: User) => isOwner(p, u) || p.memberIds.includes(u.id)
const today = () => new Date().toISOString().slice(0, 10)
const isOverdue = (t: Task) => t.due_date !== null && t.due_date < today() && t.status !== "done"

function projectItem(p: Project, u: User) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    owner: userRef(p.ownerId),
    role: isOwner(p, u) ? "owner" : "member",
    members_count: p.memberIds.length + 1,
    tasks_count: db.tasks.filter((t) => t.projectId === p.id).length,
    created_at: p.created_at,
  }
}
function projectDetail(p: Project, u: User) {
  const owner = isOwner(p, u)
  return {
    ...projectItem(p, u),
    members: [p.ownerId, ...p.memberIds].map((id) => ({ ...userRef(id), is_owner: id === p.ownerId })),
    permissions: { can_edit: owner, can_delete: owner, can_manage_members: owner },
  }
}
function taskOut(t: Task, u: User) {
  const p = db.projects.find((x) => x.id === t.projectId)!
  const owner = isOwner(p, u)
  const assignee = t.assigneeId === u.id
  return {
    id: t.id,
    project: t.projectId,
    title: t.title,
    description: t.description,
    author: userRef(t.authorId),
    assignee: userRef(t.assigneeId),
    status: t.status,
    priority: t.priority,
    due_date: t.due_date,
    is_overdue: isOverdue(t),
    created_at: t.created_at,
    updated_at: t.updated_at,
    comments_count: db.comments.filter((c) => c.taskId === t.id).length,
    permissions: {
      can_edit: owner || t.authorId === u.id || assignee,
      can_delete: owner,
      can_change_status: owner || assignee,
    },
  }
}
function commentOut(c: Comment, u: User) {
  const task = db.tasks.find((t) => t.id === c.taskId)!
  const p = db.projects.find((x) => x.id === task.projectId)!
  return {
    id: c.id,
    task: c.taskId,
    author: userRef(c.authorId),
    text: c.text,
    created_at: c.created_at,
    permissions: { can_delete: c.authorId === u.id || isOwner(p, u) },
  }
}

// ───────────────────────── Доступ ─────────────────────────

const need = (ctx: Ctx): User => ctx.user ?? fail(401, "Учётные данные не были предоставлены.")

/** Проект виден только владельцу и участникам, иначе 404 (SEC-03). */
function visibleProject(ctx: Ctx, id: string): Project {
  const u = need(ctx)
  const p = db.projects.find((x) => x.id === id)
  return p && isMember(p, u) ? p : notFound()
}
function visibleTask(ctx: Ctx, id: string): { task: Task; project: Project } {
  const task = db.tasks.find((x) => x.id === id) ?? notFound()
  return { task, project: visibleProject(ctx, task.projectId) }
}

// ───────────────────────── Валидация и списки ─────────────────────────

const str = (v: unknown) => (typeof v === "string" ? v : "")

function page<T>(items: T[], query: URLSearchParams) {
  const n = Math.max(1, Number(query.get("page")) || 1)
  const results = items.slice((n - 1) * PAGE_SIZE, n * PAGE_SIZE)
  return {
    count: items.length,
    next: n * PAGE_SIZE < items.length ? `?page=${n + 1}` : null,
    previous: n > 1 ? `?page=${n - 1}` : null,
    results,
  }
}

function checkProjectInput(body: Ctx["body"], partial: boolean) {
  const errors: Record<string, string[]> = {}
  if (!partial || "name" in body) {
    const name = str(body.name).trim()
    if (name.length < 3 || name.length > 120) errors.name = ["Название: от 3 до 120 символов."]
  }
  if (Object.keys(errors).length) invalid(errors)
}

function checkTaskInput(body: Ctx["body"], project: Project, partial: boolean) {
  const errors: Record<string, string[]> = {}
  if (!partial || "title" in body) {
    const title = str(body.title).trim()
    if (title.length < 3 || title.length > 150) errors.title = ["Название: от 3 до 150 символов."]
  }
  if ("status" in body && !STATUSES.includes(body.status as Status)) errors.status = ["Недопустимый статус."]
  if ("priority" in body && !PRIORITIES.includes(body.priority as Priority)) errors.priority = ["Недопустимый приоритет."]
  if ("due_date" in body && body.due_date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(str(body.due_date)))
    errors.due_date = ["Неверный формат даты."]
  if ("assignee" in body && body.assignee !== null) {
    const a = userById(str(body.assignee))
    if (!a || !(a.id === project.ownerId || project.memberIds.includes(a.id)))
      errors.assignee = ["Исполнитель должен быть участником проекта."]
  }
  if (Object.keys(errors).length) invalid(errors)
}

function applyTaskInput(t: Task, body: Ctx["body"]) {
  if ("title" in body) t.title = str(body.title).trim()
  if ("description" in body) t.description = str(body.description)
  if ("assignee" in body) t.assigneeId = body.assignee === null ? null : str(body.assignee)
  if ("status" in body) t.status = body.status as Status
  if ("priority" in body) t.priority = body.priority as Priority
  if ("due_date" in body) t.due_date = body.due_date === null || body.due_date === "" ? null : str(body.due_date)
  t.updated_at = new Date().toISOString()
}

function filterTasks(tasks: Task[], query: URLSearchParams): Task[] {
  const search = (query.get("search") ?? "").trim().toLowerCase()
  const status = query.get("status")
  const priority = query.get("priority")
  const assignee = query.get("assignee")
  const ordering = query.get("ordering") ?? "-created_at"

  const list = tasks.filter(
    (t) =>
      (!search || t.title.toLowerCase().includes(search)) &&
      (!status || t.status === status) &&
      (!priority || t.priority === priority) &&
      (!assignee || (assignee === "none" ? t.assigneeId === null : t.assigneeId === assignee)),
  )

  const desc = ordering.startsWith("-")
  const field = ordering.replace(/^-/, "")
  const dir = desc ? -1 : 1
  return list.sort((a, b) => {
    if (field === "due_date") {
      // задачи без срока всегда в конце
      if (a.due_date === b.due_date) return 0
      if (a.due_date === null) return 1
      if (b.due_date === null) return -1
      return a.due_date < b.due_date ? -dir : dir
    }
    if (field === "priority") return (PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]) * dir
    return (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0) * dir
  })
}

// ───────────────────────── Сессия ─────────────────────────

function issueSession(ctx: Ctx, user: User) {
  const access = `acc_${randomUUID()}`
  db.accessTokens.set(access, { userId: user.id, exp: Date.now() + ACCESS_TTL_MS })
  const refresh = `ref_${randomUUID()}`
  db.refreshTokens.set(refresh, user.id)
  ctx.setCookie.push(
    `${REFRESH_COOKIE}=${refresh}; HttpOnly; Path=/api/auth/; SameSite=Strict; Max-Age=${7 * 86_400}`,
  )
  return access
}
const clearRefreshCookie = (ctx: Ctx) =>
  ctx.setCookie.push(`${REFRESH_COOKIE}=; HttpOnly; Path=/api/auth/; SameSite=Strict; Max-Age=0`)

// ───────────────────────── Аккаунты ─────────────────────────

route("POST", "/auth/register/", (ctx) => {
  const username = str(ctx.body.username).trim()
  const email = str(ctx.body.email).trim().toLowerCase()
  const password = str(ctx.body.password)
  const errors: Record<string, string[]> = {}
  if (!username) errors.username = ["Укажите имя пользователя."]
  else if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase()))
    errors.username = ["Пользователь с таким именем уже существует."]
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = ["Введите корректный email."]
  else if (db.users.some((u) => u.email === email)) errors.email = ["Этот email уже используется."]
  if (password.length < 8) errors.password = ["Пароль слишком короткий: минимум 8 символов."]
  if (Object.keys(errors).length) invalid(errors)

  const user: User = { id: randomUUID(), username, email, password, date_joined: new Date().toISOString() }
  db.users.push(user)
  return { status: 201, body: { id: user.id, username: user.username } }
}, { public: true })

route("POST", "/auth/login/", (ctx) => {
  const user = db.users.find(
    (u) => u.username.toLowerCase() === str(ctx.body.username).toLowerCase() && u.password === str(ctx.body.password),
  )
  if (!user) return fail(401, "Неверное имя пользователя или пароль")
  return { status: 200, body: { access: issueSession(ctx, user) } }
}, { public: true })

route("POST", "/auth/refresh/", (ctx) => {
  const old = ctx.cookies[REFRESH_COOKIE]
  const userId = old ? db.refreshTokens.get(old) : undefined
  const user = userId ? userById(userId) : undefined
  if (!old || !user) {
    clearRefreshCookie(ctx)
    return fail(401, "Сессия истекла.")
  }
  db.refreshTokens.delete(old) // ротация: старый refresh больше не действует
  return { status: 200, body: { access: issueSession(ctx, user) } }
}, { public: true })

route("POST", "/auth/logout/", (ctx) => {
  const old = ctx.cookies[REFRESH_COOKIE]
  if (old) db.refreshTokens.delete(old)
  clearRefreshCookie(ctx)
  return { status: 204 }
}, { public: true })

const meOut = (u: User) => ({ id: u.id, username: u.username, email: u.email, date_joined: u.date_joined })

route("GET", "/me/", (ctx) => ({ status: 200, body: meOut(need(ctx)) }))

route("PATCH", "/me/", (ctx) => {
  const u = need(ctx)
  const errors: Record<string, string[]> = {}
  if ("username" in ctx.body) {
    const username = str(ctx.body.username).trim()
    if (!username) errors.username = ["Укажите имя пользователя."]
    else if (db.users.some((x) => x.id !== u.id && x.username.toLowerCase() === username.toLowerCase()))
      errors.username = ["Пользователь с таким именем уже существует."]
  }
  if ("email" in ctx.body) {
    const email = str(ctx.body.email).trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = ["Введите корректный email."]
    else if (db.users.some((x) => x.id !== u.id && x.email === email)) errors.email = ["Этот email уже используется."]
  }
  if (Object.keys(errors).length) invalid(errors)
  if ("username" in ctx.body) u.username = str(ctx.body.username).trim()
  if ("email" in ctx.body) u.email = str(ctx.body.email).trim().toLowerCase()
  return { status: 200, body: meOut(u) }
})

route("GET", "/me/tasks/", (ctx) => {
  const u = need(ctx)
  const mine = db.tasks.filter((t) => {
    const p = db.projects.find((x) => x.id === t.projectId)
    return t.assigneeId === u.id && p && isMember(p, u)
  })
  const items = filterTasks(mine, ctx.query).map((t) => {
    const p = db.projects.find((x) => x.id === t.projectId)!
    return { ...taskOut(t, u), project: { id: p.id, name: p.name } }
  })
  return { status: 200, body: page(items, ctx.query) }
})

// ───────────────────────── Проекты ─────────────────────────

route("GET", "/projects/", (ctx) => {
  const u = need(ctx)
  const items = db.projects
    .filter((p) => isMember(p, u))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map((p) => projectItem(p, u))
  return { status: 200, body: page(items, ctx.query) }
})

route("POST", "/projects/", (ctx) => {
  const u = need(ctx)
  checkProjectInput(ctx.body, false)
  const p: Project = {
    id: randomUUID(), name: str(ctx.body.name).trim(), description: str(ctx.body.description),
    ownerId: u.id, memberIds: [], created_at: new Date().toISOString(),
  }
  db.projects.push(p)
  return { status: 201, body: projectDetail(p, u) }
})

route("GET", "/projects/:pid/", (ctx) => {
  const p = visibleProject(ctx, ctx.params.pid)
  return { status: 200, body: projectDetail(p, ctx.user!) }
})

route("PATCH", "/projects/:pid/", (ctx) => {
  const p = visibleProject(ctx, ctx.params.pid)
  if (!isOwner(p, ctx.user!)) forbidden()
  checkProjectInput(ctx.body, true)
  if ("name" in ctx.body) p.name = str(ctx.body.name).trim()
  if ("description" in ctx.body) p.description = str(ctx.body.description)
  return { status: 200, body: projectDetail(p, ctx.user!) }
})

route("DELETE", "/projects/:pid/", (ctx) => {
  const p = visibleProject(ctx, ctx.params.pid)
  if (!isOwner(p, ctx.user!)) forbidden()
  const taskIds = db.tasks.filter((t) => t.projectId === p.id).map((t) => t.id)
  db.comments = db.comments.filter((c) => !taskIds.includes(c.taskId))
  db.tasks = db.tasks.filter((t) => t.projectId !== p.id)
  db.projects = db.projects.filter((x) => x.id !== p.id)
  return { status: 204 }
})

route("GET", "/projects/:pid/stats/", (ctx) => {
  const p = visibleProject(ctx, ctx.params.pid)
  const tasks = db.tasks.filter((t) => t.projectId === p.id)
  const count = (s: Status) => tasks.filter((t) => t.status === s).length
  const done = count("done")
  return {
    status: 200,
    body: {
      total: tasks.length,
      todo: count("todo"),
      in_progress: count("in_progress"),
      done,
      overdue: tasks.filter(isOverdue).length,
      done_percent: tasks.length ? Math.round((done / tasks.length) * 1000) / 10 : 0,
    },
  }
})

route("POST", "/projects/:pid/members/", (ctx) => {
  const p = visibleProject(ctx, ctx.params.pid)
  if (!isOwner(p, ctx.user!)) forbidden()
  const target = db.users.find((u) => u.username.toLowerCase() === str(ctx.body.username).trim().toLowerCase())
  if (!target) return invalid({ username: ["Пользователь не найден"] })
  if (isMember(p, target)) return invalid({ username: ["Уже участник проекта"] })
  p.memberIds.push(target.id)
  return { status: 201, body: { id: target.id, username: target.username } }
})

route("DELETE", "/projects/:pid/members/:uid/", (ctx) => {
  const p = visibleProject(ctx, ctx.params.pid)
  if (!isOwner(p, ctx.user!)) forbidden()
  if (ctx.params.uid === p.ownerId) return fail(400, "Владельца нельзя исключить из проекта.")
  if (!p.memberIds.includes(ctx.params.uid)) notFound()
  p.memberIds = p.memberIds.filter((id) => id !== ctx.params.uid)
  db.tasks.filter((t) => t.projectId === p.id && t.assigneeId === ctx.params.uid).forEach((t) => (t.assigneeId = null))
  return { status: 204 }
})

// ───────────────────────── Задачи ─────────────────────────

route("GET", "/projects/:pid/tasks/", (ctx) => {
  const p = visibleProject(ctx, ctx.params.pid)
  const list = filterTasks(db.tasks.filter((t) => t.projectId === p.id), ctx.query)
  return { status: 200, body: page(list.map((t) => taskOut(t, ctx.user!)), ctx.query) }
})

route("POST", "/projects/:pid/tasks/", (ctx) => {
  const p = visibleProject(ctx, ctx.params.pid)
  const u = ctx.user!
  checkTaskInput(ctx.body, p, false)
  const now = new Date().toISOString()
  const t: Task = {
    id: randomUUID(), projectId: p.id, title: "", description: "", authorId: u.id, assigneeId: null,
    status: "todo", priority: "medium", due_date: null, created_at: now, updated_at: now,
  }
  applyTaskInput(t, ctx.body)
  db.tasks.push(t)
  return { status: 201, body: taskOut(t, u) }
})

route("GET", "/tasks/:tid/", (ctx) => {
  const { task } = visibleTask(ctx, ctx.params.tid)
  return { status: 200, body: taskOut(task, ctx.user!) }
})

route("PATCH", "/tasks/:tid/", (ctx) => {
  const { task, project } = visibleTask(ctx, ctx.params.tid)
  const out = taskOut(task, ctx.user!)
  if (!out.permissions.can_edit) forbidden()
  checkTaskInput(ctx.body, project, true)
  applyTaskInput(task, ctx.body)
  return { status: 200, body: taskOut(task, ctx.user!) }
})

route("PATCH", "/tasks/:tid/status/", (ctx) => {
  const { task } = visibleTask(ctx, ctx.params.tid)
  if (!taskOut(task, ctx.user!).permissions.can_change_status) forbidden()
  if (!STATUSES.includes(ctx.body.status as Status)) invalid({ status: ["Недопустимый статус."] })
  task.status = ctx.body.status as Status
  task.updated_at = new Date().toISOString()
  return { status: 200, body: taskOut(task, ctx.user!) }
})

route("DELETE", "/tasks/:tid/", (ctx) => {
  const { task, project } = visibleTask(ctx, ctx.params.tid)
  if (!isOwner(project, ctx.user!)) forbidden()
  db.comments = db.comments.filter((c) => c.taskId !== task.id)
  db.tasks = db.tasks.filter((t) => t.id !== task.id)
  return { status: 204 }
})

// ───────────────────────── Комментарии ─────────────────────────

route("GET", "/tasks/:tid/comments/", (ctx) => {
  const { task } = visibleTask(ctx, ctx.params.tid)
  const items = db.comments
    .filter((c) => c.taskId === task.id)
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
    .map((c) => commentOut(c, ctx.user!))
  return { status: 200, body: page(items, ctx.query) }
})

route("POST", "/tasks/:tid/comments/", (ctx) => {
  const { task } = visibleTask(ctx, ctx.params.tid)
  const text = str(ctx.body.text).trim()
  if (!text) invalid({ text: ["Комментарий не может быть пустым."] })
  const c: Comment = { id: randomUUID(), taskId: task.id, authorId: ctx.user!.id, text, created_at: new Date().toISOString() }
  db.comments.push(c)
  return { status: 201, body: commentOut(c, ctx.user!) }
})

route("DELETE", "/comments/:cid/", (ctx) => {
  const c = db.comments.find((x) => x.id === ctx.params.cid) ?? notFound()
  visibleTask(ctx, c.taskId) // чужой комментарий = 404
  if (!commentOut(c, ctx.user!).permissions.can_delete) forbidden()
  db.comments = db.comments.filter((x) => x.id !== c.id)
  return { status: 204 }
})

// ───────────────────────── Вход в обработчик ─────────────────────────

function parseCookies(header: string | undefined) {
  const out: Record<string, string> = {}
  for (const part of (header ?? "").split(";")) {
    const i = part.indexOf("=")
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim()
  }
  return out
}

function userFromAuth(header: string | undefined): User | null {
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null
  const entry = token ? db.accessTokens.get(token) : undefined
  if (!entry || entry.exp < Date.now()) return null
  return userById(entry.userId) ?? null
}

export async function handle(req: IncomingMessage, raw: string, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://mock")
  const path = url.pathname.replace(/^\/api/, "")
  const method = req.method ?? "GET"
  const ctx: Ctx = {
    params: {}, query: url.searchParams, body: {}, cookies: parseCookies(req.headers.cookie),
    setCookie: [], user: userFromAuth(req.headers.authorization),
  }

  let result: Result
  try {
    if (raw) {
      try {
        ctx.body = JSON.parse(raw) as Ctx["body"]
      } catch {
        fail(400, "Некорректный JSON.")
      }
    }
    let matched: Route | undefined
    for (const r of routes) {
      const m = r.method === method ? r.regex.exec(path) : null
      if (m) {
        matched = r
        r.names.forEach((n, i) => (ctx.params[n] = decodeURIComponent(m[i + 1])))
        break
      }
    }
    if (!matched) notFound()
    // неверный формат UUID в пути = 404 (как конвертер <uuid:…> в Django)
    for (const v of Object.values(ctx.params)) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) notFound()
    }
    if (!matched!.public) need(ctx)
    result = matched!.handler(ctx)
  } catch (e) {
    result = e instanceof HttpError ? { status: e.status, body: e.body } : { status: 500, body: { detail: String(e) } }
  }

  await new Promise((r) => setTimeout(r, LATENCY_MS))
  const headers: Record<string, string | string[]> = { "Content-Type": "application/json; charset=utf-8" }
  if (ctx.setCookie.length) headers["Set-Cookie"] = ctx.setCookie
  res.writeHead(result.status, headers)
  res.end(result.body === undefined ? undefined : JSON.stringify(result.body))
}
