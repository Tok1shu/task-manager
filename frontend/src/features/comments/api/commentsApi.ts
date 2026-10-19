import { api } from "@/shared/api/client"
import type { CommentId, TaskId } from "@/shared/api/ids"
import type { Page, UserRef } from "@/shared/api/types"

export interface Comment {
  id: CommentId
  task: TaskId
  author: UserRef
  text: string
  created_at: string
  permissions: { can_delete: boolean }
}

export const commentsApi = {
  list: (taskId: TaskId) => api.get<Page<Comment>>(`/tasks/${taskId}/comments/`),
  add: (taskId: TaskId, text: string) => api.post<Comment>(`/tasks/${taskId}/comments/`, { text }),
  remove: (id: CommentId) => api.delete(`/comments/${id}/`),
}
