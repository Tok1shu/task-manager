import type { ProjectId } from "@/shared/api/ids"
import { formatPercent } from "@/shared/lib/format"
import { cn } from "@/shared/lib/cn"
import { Card, ErrorState, ProgressBar, Spinner } from "@/shared/ui"
import { useProjectStats } from "../api/projects.queries"

function Tile({ label, value, tone }: { label: string; value: number; tone?: "danger" }) {
  return (
    <div className="rounded-lg bg-surface-sunken px-3 py-2.5">
      <div className={cn("text-xl font-semibold text-bright", tone === "danger" && value > 0 && "text-danger-400")}>{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  )
}

/** Сводная статистика проекта (FR-25 – FR-27): считает сервер, здесь только показ. */
export function StatsPanel({ projectId }: { projectId: ProjectId }) {
  const stats = useProjectStats(projectId)
  if (stats.isError) return <ErrorState error={stats.error} onRetry={() => void stats.refetch()} />
  if (!stats.data)
    return (
      <Card className="flex justify-center p-6 text-accent-500">
        <Spinner />
      </Card>
    )
  const s = stats.data
  return (
    <Card className="p-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Tile label="Всего задач" value={s.total} />
        <Tile label="К выполнению" value={s.todo} />
        <Tile label="В работе" value={s.in_progress} />
        <Tile label="Готово" value={s.done} />
        <Tile label="Просрочено" value={s.overdue} tone="danger" />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar value={s.done_percent} label="Выполнено" />
        </div>
        <span className="text-sm font-medium text-secondary">{formatPercent(s.done_percent)}</span>
      </div>
    </Card>
  )
}
