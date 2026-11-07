import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api, ApiError, fieldError, onUnauthorized, setAccessToken } from "./client"

const reply = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status })

const fetchMock = vi.fn()
const urlOf = (call: number) => fetchMock.mock.calls[call][0] as string
const headersOf = (call: number) => (fetchMock.mock.calls[call][1] as RequestInit).headers as Record<string, string>

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal("fetch", fetchMock)
  setAccessToken(null)
  onUnauthorized(null)
})
afterEach(() => vi.unstubAllGlobals())

describe("api client", () => {
  it("подставляет Bearer-токен и параметры запроса, пустые параметры отбрасывает", async () => {
    setAccessToken("abc")
    fetchMock.mockResolvedValue(reply(200, { ok: true }))
    await api.get("/projects/", { page: 2, search: "", status: undefined })
    expect(urlOf(0)).toBe("/api/projects/?page=2")
    expect(headersOf(0).Authorization).toBe("Bearer abc")
  })

  it("при 401 обновляет токен и повторяет запрос один раз", async () => {
    setAccessToken("old")
    fetchMock
      .mockResolvedValueOnce(reply(401, { detail: "expired" }))
      .mockResolvedValueOnce(reply(200, { access: "new" }))
      .mockResolvedValueOnce(reply(200, { id: 1 }))

    await expect(api.get("/me/")).resolves.toEqual({ id: 1 })
    expect(urlOf(1)).toBe("/api/auth/refresh/")
    expect(headersOf(2).Authorization).toBe("Bearer new")
  })

  it("если refresh не удался — сообщает о потере сессии и бросает ApiError 401", async () => {
    const lost = vi.fn()
    onUnauthorized(lost)
    fetchMock.mockResolvedValueOnce(reply(401, {})).mockResolvedValueOnce(reply(401, {})).mockResolvedValue(reply(401, {}))

    await expect(api.get("/me/")).rejects.toMatchObject({ status: 401 })
    expect(lost).toHaveBeenCalledOnce()
  })

  it("публичные запросы (вход) не пытаются обновить токен", async () => {
    fetchMock.mockResolvedValue(reply(401, { detail: "Неверное имя пользователя или пароль" }))
    await expect(api.post("/auth/login/", {}, { auth: false })).rejects.toThrow("Неверное имя пользователя или пароль")
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it("разбирает ошибки валидации по полям", async () => {
    fetchMock.mockResolvedValue(reply(400, { title: ["Минимум 3 символа"] }))
    const error = await api.post("/x/", {}).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(fieldError(error, "title")).toBe("Минимум 3 символа")
    expect(fieldError(error, "other")).toBeUndefined()
  })

  it("204 возвращает undefined", async () => {
    fetchMock.mockResolvedValue(reply(204))
    await expect(api.delete("/tasks/x/")).resolves.toBeUndefined()
  })
})
