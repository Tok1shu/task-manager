import { Badge } from "@/shared/ui"
import type { TaskPriority, TaskStatus } from "../api/types"
import { priorityMeta, statusMeta } from "../constants"

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const { label, tone } = statusMeta(status)
  return <Badge tone={tone}>{label}</Badge>
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  const { label, tone } = priorityMeta(priority)
  return <Badge tone={tone}>{label}</Badge>
}
