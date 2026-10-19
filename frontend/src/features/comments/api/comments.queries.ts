import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { CommentId, TaskId } from "@/shared/api/ids"
import { rootKeys } from "@/shared/api/queryKeys"
import { commentsApi } from "./commentsApi"

export const commentKeys = {
  list: (taskId: TaskId) => [...rootKeys.comments, "list", taskId] as const,
}

export const useComments = (taskId: TaskId) =>
  useQuery({ queryKey: commentKeys.list(taskId), queryFn: () => commentsApi.list(taskId) })

/** Комментарий меняет счётчик в задаче, поэтому сбрасываем и комментарии, и задачи. */
function useRefreshAfterChange() {
  const qc = useQueryClient()
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: rootKeys.comments }),
      qc.invalidateQueries({ queryKey: rootKeys.tasks }),
    ])
}

export function useAddComment(taskId: TaskId) {
  const refresh = useRefreshAfterChange()
  return useMutation({ mutationFn: (text: string) => commentsApi.add(taskId, text), onSuccess: refresh })
}

export function useDeleteComment() {
  const refresh = useRefreshAfterChange()
  return useMutation({ mutationFn: (id: CommentId) => commentsApi.remove(id), onSuccess: refresh })
}
