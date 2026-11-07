import { QueryClient } from "@tanstack/react-query"
import { ApiError } from "./client"

/** Повторяем только сетевые ошибки и 5xx, один раз. 4xx — ответ сервера, повтор не поможет. */
const retry = (count: number, error: unknown) =>
  count < 1 && !(error instanceof ApiError && error.status < 500)

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry, refetchOnWindowFocus: false },
    },
  })

export const queryClient = createQueryClient()
