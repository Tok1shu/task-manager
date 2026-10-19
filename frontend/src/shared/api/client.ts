// Единый HTTP-клиент. Access-токен сохраняется в localStorage; refresh приходит в HttpOnly-cookie
// и обновляется запросом POST /api/auth/refresh/. Одновременные 401 делят один запрос refresh.
const BASE = "/api"

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public fields: Record<string, string[]> = {},
  ) {
    super(detail)
    this.name = "ApiError"
  }
}

/** Ошибка валидации конкретного поля формы. */
export const fieldError = (error: unknown, name: string): string | undefined =>
  error instanceof ApiError ? error.fields[name]?.[0] : undefined

const DEFAULT_DETAIL: Record<number, string> = {
  401: "Нужно войти в систему.",
  403: "У вас нет прав на это действие.",
  404: "Не найдено.",
  429: "Слишком много попыток. Попробуйте позже.",
}

function toApiError(status: number, body: unknown): ApiError {
  const data = (body && typeof body === "object" ? body : {}) as Record<string, unknown>
  const { detail, non_field_errors, ...rest } = data
  const fields: Record<string, string[]> = {}
  for (const [key, value] of Object.entries(rest)) {
    if (Array.isArray(value)) fields[key] = value.map(String)
  }
  const message =
    (typeof detail === "string" && detail) ||
    (Array.isArray(non_field_errors) && String(non_field_errors[0])) ||
    (Object.keys(fields).length ? "Проверьте поля формы." : DEFAULT_DETAIL[status] ?? "Что-то пошло не так.")
  return new ApiError(status, message, fields)
}

type Query = Record<string, string | number | undefined | null>
interface Options {
  params?: Query
  body?: unknown
  /** false для публичных запросов (вход, регистрация): без токена и без повтора по 401. */
  auth?: boolean
}

const TOKEN_KEY = "access_token"

function getStoredToken(): string | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null
  } catch {
    return null
  }
}

let accessToken: string | null = getStoredToken()
let unauthorizedHandler: (() => void) | null = null
let refreshing: Promise<string | null> | null = null

export const setAccessToken = (token: string | null) => {
  accessToken = token
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch {}
}
export const onUnauthorized = (handler: (() => void) | null) => {
  unauthorizedHandler = handler
}

async function doRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/auth/refresh/`, { method: "POST", credentials: "same-origin" })
    if (!res.ok) return null
    const data = (await res.json()) as { access: string }
    return data.access
  } catch {
    return null
  }
}

/** Получить новый access по refresh-cookie. null — сессии нет. */
export function refreshAccessToken(): Promise<string | null> {
  refreshing ??= doRefresh()
    .then((token) => {
      setAccessToken(token)
      return token
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

function buildUrl(path: string, params?: Query) {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") qs.set(key, String(value))
  }
  const suffix = qs.size ? `?${qs}` : ""
  return `${BASE}${path}${suffix}`
}

async function send<T>(method: string, path: string, options: Options, canRetry = true): Promise<T> {
  const useAuth = options.auth !== false
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers["Content-Type"] = "application/json"
  if (useAuth && accessToken) headers.Authorization = `Bearer ${accessToken}`

  const res = await fetch(buildUrl(path, options.params), {
    method,
    headers,
    credentials: "same-origin",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (res.status === 401 && useAuth && canRetry) {
    if (await refreshAccessToken()) return send<T>(method, path, options, false)
    unauthorizedHandler?.()
  }
  if (res.status === 204) return undefined as T

  const text = await res.text()
  const data: unknown = text ? JSON.parse(text) : undefined
  if (!res.ok) throw toApiError(res.status, data)
  return data as T
}

export const api = {
  get: <T>(path: string, params?: Query, options: Omit<Options, "params" | "body"> = {}) =>
    send<T>("GET", path, { ...options, params }),
  post: <T>(path: string, body?: unknown, options: Omit<Options, "body"> = {}) =>
    send<T>("POST", path, { ...options, body }),
  patch: <T>(path: string, body: unknown) => send<T>("PATCH", path, { body }),
  delete: <T = void>(path: string) => send<T>("DELETE", path, {}),
}
