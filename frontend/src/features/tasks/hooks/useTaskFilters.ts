import { useSearchParams } from "react-router"
import { DEFAULT_ORDERING } from "../constants"
import type { TaskFilters } from "../api/types"

const EMPTY: TaskFilters = { search: "", status: "", priority: "", assignee: "", ordering: DEFAULT_ORDERING, page: 1 }

/** Фильтры живут в адресной строке: ссылкой можно поделиться, «назад» работает. */
export function useTaskFilters() {
  const [params, setParams] = useSearchParams()

  const filters: TaskFilters = {
    search: params.get("search") ?? EMPTY.search,
    status: (params.get("status") ?? EMPTY.status) as TaskFilters["status"],
    priority: (params.get("priority") ?? EMPTY.priority) as TaskFilters["priority"],
    assignee: params.get("assignee") ?? EMPTY.assignee,
    ordering: params.get("ordering") ?? EMPTY.ordering,
    page: Number(params.get("page")) || 1,
  }

  const setFilters = (patch: Partial<TaskFilters>) => {
    // любое изменение фильтра возвращает на первую страницу
    const next: TaskFilters = { ...filters, page: 1, ...patch }
    const out = new URLSearchParams()
    for (const key of Object.keys(EMPTY) as (keyof TaskFilters)[]) {
      if (String(next[key]) !== String(EMPTY[key])) out.set(key, String(next[key]))
    }
    setParams(out, { replace: true })
  }

  const hasActive = Object.keys(EMPTY).some(
    (key) => key !== "page" && key !== "ordering" && String(filters[key as keyof TaskFilters]) !== String(EMPTY[key as keyof TaskFilters]),
  )

  return { filters, setFilters, reset: () => setParams({}, { replace: true }), hasActive }
}
