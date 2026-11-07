import { Link } from "react-router"
import { CalendarClock, MessageSquare, User } from "lucide-react"
import { formatDate } from "@/shared/lib/format"
import { cn } from "@/shared/lib/cn"
import { Badge } from "@/shared/ui"
import type { MyTask, Task } from "../api/types"
import { TaskPriorityBadge, TaskStatusBadge } from "./TaskBadges"

/** Строка задачи: общая для списка проекта и «Моих задач». */
export function TaskRow({ task, projectName }: { task: Task | MyTask; projectName?: string }) {
  return (
    <Link
      to={`/tasks/${task.id}`}
      className="block rounded-xl border border-border-subtle bg-surface-card p-4 transition-colors hover:border-border-hover hover:bg-surface-elevated"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 font-medium break-words text-bright">{task.title}</h3>
        <div className="flex flex-wrap gap-1.5">
          <TaskStatusBadge status={task.status} />
          <TaskPriorityBadge priority={task.priority} />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        {projectName && <span className="font-medium text-subtle">{projectName}</span>}
        <span className="inline-flex items-center gap-1">
          <User className="size-3.5" />
          {task.assignee ? task.assignee.username : "Не назначена"}
        </span>
        {task.due_date && (
          <span className={cn("inline-flex items-center gap-1", task.is_overdue && "text-danger-400")}>
            <CalendarClock className="size-3.5" />
            {formatDate(task.due_date)}
            {task.is_overdue && <Badge tone="danger">Просрочена</Badge>}
          </span>
        )}
        {task.comments_count > 0 && (
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3.5" />
            {task.comments_count}
          </span>
        )}
      </div>
    </Link>
  )
}
