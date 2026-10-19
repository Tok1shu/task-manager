import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ProjectId, UserId } from "@/shared/api/ids"
import { rootKeys } from "@/shared/api/queryKeys"
import { projectsApi } from "./projectsApi"
import type { ProjectInput } from "./types"

export const projectKeys = {
  list: (page: number) => [...rootKeys.projects, "list", page] as const,
  detail: (id: ProjectId) => [...rootKeys.projects, "detail", id] as const,
  stats: (id: ProjectId) => [...rootKeys.projects, "stats", id] as const,
}

export const useProjects = (page: number) =>
  useQuery({ queryKey: projectKeys.list(page), queryFn: () => projectsApi.list(page), placeholderData: keepPreviousData })

/** `id` может быть неизвестен, пока не загружена сущность-родитель (например, задача): тогда запрос ждёт. */
export const useProject = (id: ProjectId | undefined) =>
  useQuery({ queryKey: projectKeys.detail(id!), queryFn: () => projectsApi.get(id!), enabled: !!id })

export const useProjectStats = (id: ProjectId) =>
  useQuery({ queryKey: projectKeys.stats(id), queryFn: () => projectsApi.stats(id) })

const useRefreshProjects = () => {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: rootKeys.projects })
}

export const useCreateProject = () => {
  const refresh = useRefreshProjects()
  return useMutation({ mutationFn: projectsApi.create, onSuccess: refresh })
}

export const useUpdateProject = (id: ProjectId) => {
  const refresh = useRefreshProjects()
  return useMutation({ mutationFn: (input: Partial<ProjectInput>) => projectsApi.update(id, input), onSuccess: refresh })
}

/** Удаление проекта уносит и его задачи, и комментарии — сбрасываем все три раздела кеша. */
export const useDeleteProject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: ProjectId) => projectsApi.remove(id),
    onSuccess: () =>
      Promise.all([rootKeys.projects, rootKeys.tasks, rootKeys.comments].map((queryKey) => qc.invalidateQueries({ queryKey }))),
  })
}

export const useAddMember = (id: ProjectId) => {
  const refresh = useRefreshProjects()
  return useMutation({ mutationFn: (username: string) => projectsApi.addMember(id, username), onSuccess: refresh })
}

/** Исключение участника снимает его с задач, поэтому сбрасываем и задачи. */
export const useRemoveMember = (id: ProjectId) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: UserId) => projectsApi.removeMember(id, userId),
    onSuccess: () => Promise.all([rootKeys.projects, rootKeys.tasks].map((queryKey) => qc.invalidateQueries({ queryKey }))),
  })
}
