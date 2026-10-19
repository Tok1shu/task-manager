import { ErrorState, EmptyState, PageHeader, PageSpinner, Pager } from "@/shared/ui"
import { useMyTasks } from "../api/tasks.queries"
import { TaskFilters } from "../components/TaskFilters"
import { TaskRow } from "../components/TaskRow"
import { useTaskFilters } from "../hooks/useTaskFilters"

export default function MyTasksPage() {
  const { filters, setFilters, reset, hasActive } = useTaskFilters()
  const tasks = useMyTasks(filters)

  return (
    <>
      <PageHeader title="Мои задачи" subtitle="Задачи, назначенные на вас, из всех проектов" />
      <TaskFilters filters={filters} onChange={setFilters} onReset={reset} canReset={hasActive} />
      {tasks.isPending ? (
        <PageSpinner />
      ) : tasks.isError ? (
        <ErrorState error={tasks.error} onRetry={() => void tasks.refetch()} />
      ) : tasks.data.results.length === 0 ? (
        <EmptyState
          title={hasActive ? "Ничего не найдено" : "Вам пока ничего не назначено"}
          hint={hasActive ? "Измените условия поиска." : "Когда вас назначат исполнителем, задача появится здесь."}
        />
      ) : (
        <>
          <ul className="space-y-2">
            {tasks.data.results.map((task) => (
              <li key={task.id}>
                <TaskRow task={task} projectName={task.project.name} />
              </li>
            ))}
          </ul>
          <Pager page={filters.page} count={tasks.data.count} onChange={(page) => setFilters({ page })} />
        </>
      )}
    </>
  )
}
