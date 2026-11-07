import type { FormEvent } from "react"
import { Trash2 } from "lucide-react"
import { fieldError } from "@/shared/api/client"
import type { TaskId } from "@/shared/api/ids"
import { useFormValues } from "@/shared/hooks/useFormValues"
import { formatDateTime } from "@/shared/lib/format"
import { confirm } from "@/shared/stores/confirm"
import { toast } from "@/shared/stores/toast"
import { Button, Card, EmptyState, ErrorState, Field, FormError, PageSpinner, Textarea } from "@/shared/ui"
import { useAddComment, useComments, useDeleteComment } from "../api/comments.queries"

/** Комментарии к задаче: список в хронологическом порядке и форма добавления (FR-17 – FR-20). */
export function CommentSection({ taskId }: { taskId: TaskId }) {
  const comments = useComments(taskId)
  const add = useAddComment(taskId)
  const remove = useDeleteComment()
  const { values, bind, reset } = useFormValues({ text: "" })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    add.mutate(values.text, { onSuccess: reset })
  }

  const onDelete = async (id: Parameters<typeof remove.mutate>[0]) => {
    if (!(await confirm({ title: "Удалить комментарий?", confirmLabel: "Удалить", danger: true }))) return
    remove.mutate(id, {
      onSuccess: () => toast.success("Комментарий удалён"),
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <section aria-labelledby="comments-title">
      <h2 id="comments-title" className="mb-3 text-lg font-semibold text-bright">
        Комментарии{comments.data ? ` (${comments.data.count})` : ""}
      </h2>

      {comments.isPending ? (
        <PageSpinner />
      ) : comments.isError ? (
        <ErrorState error={comments.error} onRetry={() => void comments.refetch()} />
      ) : comments.data.results.length === 0 ? (
        <EmptyState title="Комментариев пока нет" hint="Начните обсуждение первым." />
      ) : (
        <ul className="space-y-2">
          {comments.data.results.map((c) => (
            <li key={c.id}>
              <Card className="p-3">
                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted">
                  <span>
                    <span className="font-medium text-subtle">{c.author.username}</span> · {formatDateTime(c.created_at)}
                  </span>
                  {c.permissions.can_delete && (
                    <button
                      type="button"
                      aria-label="Удалить комментарий"
                      onClick={() => void onDelete(c.id)}
                      className="rounded p-1 text-faint hover:bg-surface-hover hover:text-danger-400"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm break-words whitespace-pre-wrap text-primary">{c.text}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
        <FormError error={add.error} />
        <Field label="Новый комментарий" error={fieldError(add.error, "text")}>
          <Textarea rows={3} invalid={!!fieldError(add.error, "text")} {...bind("text")} />
        </Field>
        <Button type="submit" loading={add.isPending}>
          Отправить
        </Button>
      </form>
    </section>
  )
}
