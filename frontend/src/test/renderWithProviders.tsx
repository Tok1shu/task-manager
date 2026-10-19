import type { ReactElement } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { createQueryClient } from "@/shared/api/queryClient"

/** Свежий QueryClient и роутер на каждый тест, чтобы кеш не протекал между тестами. */
export function renderWithProviders(ui: ReactElement, { route = "/" }: { route?: string } = {}) {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}
