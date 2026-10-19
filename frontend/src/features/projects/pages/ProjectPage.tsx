import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { asProjectId } from "@/shared/api/ids"
import { formatDate } from "@/shared/lib/format"
import { confirm } from "@/shared/stores/confirm"
import { toast } from "@/shared/stores/toast"
import { Button, ErrorState, Modal, PageHeader, PageSpinner } from "@/shared/ui"
import { TaskForm, TaskList, useCreateTask } from "@/features/tasks"
import { useDeleteProject, useProject, useUpdateProject } from "../api/projects.queries"
import { MembersPanel } from "../components/MembersPanel"
import { ProjectForm } from "../components/ProjectForm"
import { StatsPanel } from "../components/StatsPanel"

export default function ProjectPage() {
  const projectId = asProjectId(useParams().projectId!)
  const navigate = useNavigate()
  const project = useProject(projectId)
  const update = useUpdateProject(projectId)
  const remove = useDeleteProject()
  const createTask = useCreateTask(projectId)
  const [modal, setModal] = useState<"edit" | "task" | null>(null)

  if (project.isPending) return <PageSpinner />
  if (project.isError) return <ErrorState error={project.error} onRetry={() => void project.refetch()} />
  const p = project.data

  const open = (name: "edit" | "task") => {
    update.reset()
    createTask.reset()
    setModal(name)
  }

  const onDelete = async () => {
    const ok = await confirm({
      title: `Удалить проект «${p.name}»?`,
      message: "Вместе с проектом будут удалены все его задачи и комментарии. Это нельзя отменить.",
      confirmLabel: "Удалить",
      danger: true,
    })
    if (!ok) return
    remove.mutate(p.id, {
      onSuccess: () => {
        toast.success("Проект удалён")
        navigate("/projects", { replace: true })
      },
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <>
      <PageHeader
        title={p.name}
        subtitle={`Владелец: ${p.owner.username} · создан ${formatDate(p.created_at)}`}
        actions={
          <>
            {p.permissions.can_edit && (
              <Button variant="secondary" onClick={() => open("edit")}>
                <Pencil className="size-4" />
                Изменить
              </Button>
            )}
            {p.permissions.can_delete && (
              <Button variant="secondary" className="text-danger-400" onClick={() => void onDelete()} loading={remove.isPending}>
                <Trash2 className="size-4" />
                Удалить
              </Button>
            )}
          </>
        }
      />
      {p.description && <p className="-mt-3 mb-6 max-w-3xl text-sm break-words whitespace-pre-wrap text-subtle">{p.description}</p>}

      <div className="mb-6">
        <StatsPanel projectId={p.id} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section aria-labelledby="tasks-title" className="min-w-0 lg:order-1">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id="tasks-title" className="text-lg font-semibold text-bright">Задачи</h2>
            <Button onClick={() => open("task")}>
              <Plus className="size-4" />
              Новая задача
            </Button>
          </div>
          <TaskList projectId={p.id} members={p.members} />
        </section>
        <aside className="lg:order-2">
          <MembersPanel project={p} />
        </aside>
      </div>

      <Modal open={modal === "edit"} title="Изменить проект" onClose={() => setModal(null)}>
        <ProjectForm
          initial={{ name: p.name, description: p.description }}
          submitLabel="Сохранить"
          submitting={update.isPending}
          error={update.error}
          onCancel={() => setModal(null)}
          onSubmit={(input) =>
            update.mutate(input, {
              onSuccess: () => {
                toast.success("Проект сохранён")
                setModal(null)
              },
            })
          }
        />
      </Modal>

      <Modal open={modal === "task"} title="Новая задача" onClose={() => setModal(null)}>
        <TaskForm
          members={p.members}
          submitLabel="Создать"
          submitting={createTask.isPending}
          error={createTask.error}
          onCancel={() => setModal(null)}
          onSubmit={(input) =>
            createTask.mutate(input, {
              onSuccess: () => {
                toast.success("Задача создана")
                setModal(null)
              },
            })
          }
        />
      </Modal>
    </>
  )
}
