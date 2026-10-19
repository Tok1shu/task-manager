import type { BadgeTone } from "@/shared/ui"
import type { TaskPriority, TaskStatus } from "./api/types"

// Единственное место, где живут коды статусов/приоритетов и их подписи.
export const TASK_STATUSES: { value: TaskStatus; label: string; tone: BadgeTone }[] = [
  { value: "todo", label: "К выполнению", tone: "neutral" },
  { value: "in_progress", label: "В работе", tone: "warning" },
  { value: "done", label: "Готово", tone: "accent" },
]

export const TASK_PRIORITIES: { value: TaskPriority; label: string; tone: BadgeTone }[] = [
  { value: "low", label: "Низкий", tone: "neutral" },
  { value: "medium", label: "Средний", tone: "info" },
  { value: "high", label: "Высокий", tone: "danger" },
]

export const TASK_ORDERINGS = [
  { value: "-created_at", label: "Сначала новые" },
  { value: "created_at", label: "Сначала старые" },
  { value: "due_date", label: "Срок: ближайшие" },
  { value: "-due_date", label: "Срок: дальние" },
  { value: "-priority", label: "Приоритет: высокий" },
  { value: "priority", label: "Приоритет: низкий" },
]

export const DEFAULT_ORDERING = "-created_at"

export const statusMeta = (value: TaskStatus) => TASK_STATUSES.find((s) => s.value === value)!
export const priorityMeta = (value: TaskPriority) => TASK_PRIORITIES.find((p) => p.value === value)!
