import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { Pencil, Trash2 } from "lucide-react"
import { asTaskId } from "@/shared/api/ids"
import { formatDate, formatDateTime } from "@/shared/lib/format"
import { cn } from "@/shared/lib/cn"
import { confirm } from "@/shared/stores/confirm"
import { toast } from "@/shared/stores/toast"
import { Button, Card, ErrorState, Modal, PageHeader, PageSpinner } from "@/shared/ui"
import { CommentSection } from "@/features/comments"
import { useProject } from "@/features/projects"
import {
  StatusSelect, TaskForm, TaskPriorityBadge, TaskStatusBadge, useDeleteTask, useTask, useUpdateTask,
} from "@/features/tasks"

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-primary">{children}</dd>
    </div>
  )
}

// Страница склеивает три фичи (задача, проект, комментарии), поэтому лежит в app/, а не внутри одной из них.
export default function TaskPage() {
  const taskId = asTaskId(useParams().taskId!)
  const navigate = useNavigate()
  const task = useTask(taskId)
  const project = useProject(task.data?.project)
  const update = useUpdateTask(taskId)
  const remove = useDeleteTask()
  const [editing, setEditing] = useState(false)

  if (task.isPending) return <PageSpinner />
  if (task.isError) return <ErrorState error={task.error} onRetry={() => void task.refetch()} />
  const t = task.data

  const onDelete = async () => {
    const ok = await confirm({
      title: `Удалить задачу «${t.title}»?`,
      message: "Вместе с задачей удалятся её комментарии.",
      confirmLabel: "Удалить",
      danger: true,
    })
    if (!ok) return
    remove.mutate(t.id, {
      onSuccess: () => {
        toast.success("Задача удалена")
        navigate(`/projects/${t.project}`, { replace: true })
      },
      onError: (err) => toast.error(err.message),
    })
  }

  const openEdit = () => {
    update.reset()
    setEditing(true)
  }

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={
          <Link to={`/projects/${t.project}`} className="text-accent-400 hover:underline">
            ← {project.data?.name ?? "К проекту"}
          </Link>
        }
        actions={
          <>
            {t.permissions.can_edit && (
              <Button variant="secondary" onClick={openEdit}>
                <Pencil className="size-4" />
                Изменить
              </Button>
            )}
            {t.permissions.can_delete && (
              <Button variant="secondary" className="text-danger-400" onClick={() => void onDelete()} loading={remove.isPending}>
                <Trash2 className="size-4" />
                Удалить
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-8">
          <Card className="p-4">
            <p className={cn("text-sm break-words whitespace-pre-wrap", t.description ? "text-primary" : "text-muted")}>
              {t.description || "Описания нет"}
            </p>
          </Card>
          <CommentSection taskId={t.id} />
        </div>

        <aside>
          <Card className="space-y-4 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <TaskStatusBadge status={t.status} />
              <TaskPriorityBadge priority={t.priority} />
            </div>
            <StatusSelect task={t} />
            <dl className="space-y-3 border-t border-border-subtle pt-4">
              <Info label="Исполнитель">{t.assignee?.username ?? "Не назначен"}</Info>
              <Info label="Автор">{t.author.username}</Info>
              <Info label="Срок выполнения">
                <span className={cn(t.is_overdue && "text-danger-400")}>
                  {formatDate(t.due_date)}
                  {t.is_overdue && " · просрочена"}
                </span>
              </Info>
              <Info label="Создана">{formatDateTime(t.created_at)}</Info>
              <Info label="Обновлена">{formatDateTime(t.updated_at)}</Info>
            </dl>
          </Card>
        </aside>
      </div>

      <Modal open={editing} title="Изменить задачу" onClose={() => setEditing(false)}>
        <TaskForm
          initial={t}
          members={project.data?.members ?? []}
          submitLabel="Сохранить"
          submitting={update.isPending}
          error={update.error}
          onCancel={() => setEditing(false)}
          onSubmit={(input) =>
            update.mutate(input, {
              onSuccess: () => {
                toast.success("Задача сохранена")
                setEditing(false)
              },
            })
          }
        />
      </Modal>
    </>
  )
}
