import type { ReactNode } from "react"
import { describe, expect, it } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { useTaskFilters } from "./useTaskFilters"

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={["/projects/p1?page=3"]}>{children}</MemoryRouter>
)

describe("useTaskFilters", () => {
  it("читает страницу из адреса, а смена фильтра возвращает на первую", () => {
    const { result } = renderHook(() => useTaskFilters(), { wrapper })
    expect(result.current.filters.page).toBe(3)

    act(() => result.current.setFilters({ status: "done" }))
    expect(result.current.filters).toMatchObject({ status: "done", page: 1 })
    expect(result.current.hasActive).toBe(true)
  })

  it("сброс очищает фильтры", () => {
    const { result } = renderHook(() => useTaskFilters(), { wrapper })
    act(() => result.current.setFilters({ search: "api", priority: "high" }))
    act(() => result.current.reset())
    expect(result.current.filters).toMatchObject({ search: "", priority: "", page: 1 })
    expect(result.current.hasActive).toBe(false)
  })
})
