import type { ProjectId, TaskId, UserId } from "@/shared/api/ids"
import type { UserRef } from "@/shared/api/types"

export type TaskStatus = "todo" | "in_progress" | "done"
export type TaskPriority = "low" | "medium" | "high"

export interface Task {
  id: TaskId
  project: ProjectId
  title: string
  description: string
  author: UserRef
  assignee: UserRef | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  is_overdue: boolean
  created_at: string
  updated_at: string
  comments_count: number
  permissions: { can_edit: boolean; can_delete: boolean; can_change_status: boolean }
}

/** Элемент списка «Мои задачи»: проект вложен объектом. */
export type MyTask = Omit<Task, "project"> & { project: { id: ProjectId; name: string } }

export interface TaskInput {
  title: string
  description: string
  assignee: UserId | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
}

export interface TaskFilters {
  search: string
  status: "" | TaskStatus
  priority: "" | TaskPriority
  /** id участника, `none` — без исполнителя, пусто — любой */
  assignee: string
  ordering: string
  page: number
}
