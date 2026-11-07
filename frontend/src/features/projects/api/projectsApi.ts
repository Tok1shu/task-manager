import { api } from "@/shared/api/client"
import type { ProjectId, UserId } from "@/shared/api/ids"
import type { Page, UserRef } from "@/shared/api/types"
import type { Project, ProjectDetail, ProjectInput, ProjectStats } from "./types"

export const projectsApi = {
  list: (page: number) => api.get<Page<Project>>("/projects/", { page: page > 1 ? page : undefined }),
  get: (id: ProjectId) => api.get<ProjectDetail>(`/projects/${id}/`),
  stats: (id: ProjectId) => api.get<ProjectStats>(`/projects/${id}/stats/`),
  create: (input: ProjectInput) => api.post<ProjectDetail>("/projects/", input),
  update: (id: ProjectId, input: Partial<ProjectInput>) => api.patch<ProjectDetail>(`/projects/${id}/`, input),
  remove: (id: ProjectId) => api.delete(`/projects/${id}/`),
  addMember: (id: ProjectId, username: string) => api.post<UserRef>(`/projects/${id}/members/`, { username }),
  removeMember: (id: ProjectId, userId: UserId) => api.delete(`/projects/${id}/members/${userId}/`),
}
