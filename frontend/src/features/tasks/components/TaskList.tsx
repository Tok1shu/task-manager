import { SearchX } from "lucide-react"
import type { ProjectId } from "@/shared/api/ids"
import type { UserRef } from "@/shared/api/types"
import { ErrorState, EmptyState, PageSpinner, Pager } from "@/shared/ui"
import { useProjectTasks } from "../api/tasks.queries"
import { useTaskFilters } from "../hooks/useTaskFilters"
import { TaskFilters } from "./TaskFilters"
import { TaskRow } from "./TaskRow"

/** Список задач проекта с поиском, фильтрами и сортировкой, которые работают вместе (FR-21 – FR-24). */
export function TaskList({ projectId, members }: { projectId: ProjectId; members: UserRef[] }) {
  const { filters, setFilters, reset, hasActive } = useTaskFilters()
  const tasks = useProjectTasks(projectId, filters)

  return (
    <div>
      <TaskFilters filters={filters} onChange={setFilters} onReset={reset} canReset={hasActive} members={members} />
      {tasks.isPending ? (
        <PageSpinner />
      ) : tasks.isError ? (
        <ErrorState error={tasks.error} onRetry={() => void tasks.refetch()} />
      ) : tasks.data.results.length === 0 ? (
        <EmptyState
          title={hasActive ? "Ничего не найдено" : "В проекте пока нет задач"}
          hint={hasActive ? "Измените условия поиска или сбросьте фильтры." : "Создайте первую задачу кнопкой выше."}
          action={hasActive ? undefined : <SearchX className="size-6 text-faint" />}
        />
      ) : (
        <>
          <ul className={tasks.isPlaceholderData ? "space-y-2 opacity-60" : "space-y-2"}>
            {tasks.data.results.map((task) => (
              <li key={task.id}>
                <TaskRow task={task} />
              </li>
            ))}
          </ul>
          <Pager page={filters.page} count={tasks.data.count} onChange={(page) => setFilters({ page })} />
        </>
      )}
    </div>
  )
}
