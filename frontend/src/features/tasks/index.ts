import { lazy } from "react"

export const MyTasksPage = lazy(() => import("./pages/MyTasksPage"))

export { TaskForm } from "./components/TaskForm"
export { TaskList } from "./components/TaskList"
export { StatusSelect } from "./components/StatusSelect"
export { TaskPriorityBadge, TaskStatusBadge } from "./components/TaskBadges"
export { TASK_STATUSES } from "./constants"
export { useCreateTask, useDeleteTask, useTask, useUpdateTask } from "./api/tasks.queries"
export type { Task, TaskInput } from "./api/types"
