import { ApiError } from "../api/client"

/** Общая ошибка формы (не привязанная к полю): неверный пароль, нет прав, сеть. */
export function FormError({ error }: { error: unknown }) {
  if (!error) return null
  const hasFieldErrors = error instanceof ApiError && Object.keys(error.fields).length > 0
  if (hasFieldErrors) return null
  const message = error instanceof ApiError ? error.detail : "Не удалось связаться с сервером."
  return (
    <div role="alert" className="rounded-lg border border-danger-700 bg-danger-950 px-3 py-2 text-sm text-danger-300">
      {message}
    </div>
  )
}
