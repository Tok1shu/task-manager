import { toast } from "@/shared/stores/toast"
import { Select } from "@/shared/ui"
import { useChangeTaskStatus } from "../api/tasks.queries"
import type { Task, TaskStatus } from "../api/types"
import { TASK_STATUSES } from "../constants"

/** Быстрая смена статуса без правки остальных полей (FR-14). */
export function StatusSelect({ task }: { task: Task }) {
  const change = useChangeTaskStatus(task.id)
  return (
    <Select
      aria-label="Статус задачи"
      className="w-auto min-w-40"
      value={task.status}
      disabled={!task.permissions.can_change_status || change.isPending}
      title={task.permissions.can_change_status ? undefined : "Менять статус может исполнитель или владелец проекта"}
      onChange={(e) =>
        change.mutate(e.target.value as TaskStatus, {
          onSuccess: () => toast.success("Статус обновлён"),
          onError: (err) => toast.error(err.message),
        })
      }
    >
      {TASK_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </Select>
  )
}
