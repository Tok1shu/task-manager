import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ProjectId, TaskId } from "@/shared/api/ids"
import { rootKeys } from "@/shared/api/queryKeys"
import { tasksApi } from "./tasksApi"
import type { TaskFilters, TaskInput, TaskStatus } from "./types"

export const taskKeys = {
  list: (projectId: ProjectId, filters: TaskFilters) => [...rootKeys.tasks, "list", projectId, filters] as const,
  detail: (id: TaskId) => [...rootKeys.tasks, "detail", id] as const,
  mine: (filters: TaskFilters) => [...rootKeys.tasks, "mine", filters] as const,
}

export const useProjectTasks = (projectId: ProjectId, filters: TaskFilters) =>
  useQuery({
    queryKey: taskKeys.list(projectId, filters),
    queryFn: () => tasksApi.listByProject(projectId, filters),
    placeholderData: keepPreviousData,
  })

export const useMyTasks = (filters: TaskFilters) =>
  useQuery({ queryKey: taskKeys.mine(filters), queryFn: () => tasksApi.mine(filters), placeholderData: keepPreviousData })

export const useTask = (id: TaskId) => useQuery({ queryKey: taskKeys.detail(id), queryFn: () => tasksApi.get(id) })

/** После любого изменения задачи устаревают списки задач и сводка проекта (счётчики, статистика). */
function useRefreshAfterChange() {
  const qc = useQueryClient()
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: rootKeys.tasks }),
      qc.invalidateQueries({ queryKey: rootKeys.projects }),
    ])
}

export function useCreateTask(projectId: ProjectId) {
  const refresh = useRefreshAfterChange()
  return useMutation({ mutationFn: (input: TaskInput) => tasksApi.create(projectId, input), onSuccess: refresh })
}

export function useUpdateTask(id: TaskId) {
  const refresh = useRefreshAfterChange()
  return useMutation({ mutationFn: (input: Partial<TaskInput>) => tasksApi.update(id, input), onSuccess: refresh })
}

export function useChangeTaskStatus(id: TaskId) {
  const refresh = useRefreshAfterChange()
  return useMutation({ mutationFn: (status: TaskStatus) => tasksApi.changeStatus(id, status), onSuccess: refresh })
}

export function useDeleteTask() {
  const refresh = useRefreshAfterChange()
  return useMutation({ mutationFn: (id: TaskId) => tasksApi.remove(id), onSuccess: refresh })
}
