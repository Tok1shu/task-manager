import { refreshAccessToken, setAccessToken } from "@/shared/api/client"
import { queryClient } from "@/shared/api/queryClient"
import { authApi } from "../api/authApi"
import { useAuthStore } from "./authStore"

/** При старте приложения: восстанавливаем сессию из localStorage или через refresh-cookie. */
export async function bootstrapSession() {
  const { setUser, setAnonymous } = useAuthStore.getState()
  try {
    setUser(await authApi.me())
    return
  } catch {
    // Токен отсутствует или протух — пробуем обновить через refresh
  }
  if (!(await refreshAccessToken())) return setAnonymous()
  try {
    setUser(await authApi.me())
  } catch {
    setAnonymous()
  }
}

export async function startSession(access: string) {
  setAccessToken(access)
  queryClient.clear()
  useAuthStore.getState().setUser(await authApi.me())
}

/** Выход или потеря сессии: токен и кеш данных не должны пережить пользователя. */
export function endSession() {
  setAccessToken(null)
  queryClient.clear()
  useAuthStore.getState().setAnonymous()
}
