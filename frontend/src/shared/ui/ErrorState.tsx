import { ApiError } from "../api/client"
import { Button } from "./Button"

/** Единый вид ошибки загрузки. 404 и 403 не отличаем по тексту: чужое и несуществующее выглядят одинаково. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const notFound = error instanceof ApiError && (error.status === 404 || error.status === 403)
  return (
    <div className="rounded-xl border border-border-strong px-6 py-12 text-center">
      <p className="font-medium text-secondary">
        {notFound ? "Страница не найдена" : "Не удалось загрузить данные"}
      </p>
      <p className="mt-1 text-sm text-muted">
        {notFound ? "Возможно, она удалена или у вас нет доступа." : error instanceof ApiError ? error.detail : "Проверьте соединение."}
      </p>
      {onRetry && !notFound && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Повторить
        </Button>
      )}
    </div>
  )
}
