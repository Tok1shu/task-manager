import { api } from "@/shared/api/client"
import type { ProjectId, TaskId } from "@/shared/api/ids"
import type { Page } from "@/shared/api/types"
import type { MyTask, Task, TaskFilters, TaskInput, TaskStatus } from "./types"

const toParams = (f: Partial<TaskFilters>) => ({ ...f, page: f.page && f.page > 1 ? f.page : undefined })

export const tasksApi = {
  listByProject: (projectId: ProjectId, filters: TaskFilters) =>
    api.get<Page<Task>>(`/projects/${projectId}/tasks/`, toParams(filters)),
  mine: (filters: TaskFilters) => api.get<Page<MyTask>>("/me/tasks/", toParams(filters)),
  get: (id: TaskId) => api.get<Task>(`/tasks/${id}/`),
  create: (projectId: ProjectId, input: TaskInput) => api.post<Task>(`/projects/${projectId}/tasks/`, input),
  update: (id: TaskId, input: Partial<TaskInput>) => api.patch<Task>(`/tasks/${id}/`, input),
  changeStatus: (id: TaskId, status: TaskStatus) => api.patch<Task>(`/tasks/${id}/status/`, { status }),
  remove: (id: TaskId) => api.delete(`/tasks/${id}/`),
}
