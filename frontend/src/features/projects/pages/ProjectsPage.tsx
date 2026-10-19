import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { Plus } from "lucide-react"
import { toast } from "@/shared/stores/toast"
import { Button, EmptyState, ErrorState, Modal, PageHeader, PageSpinner, Pager } from "@/shared/ui"
import { useCreateProject, useProjects } from "../api/projects.queries"
import { ProjectCard } from "../components/ProjectCard"
import { ProjectForm } from "../components/ProjectForm"

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const page = Number(params.get("page")) || 1
  const projects = useProjects(page)
  const create = useCreateProject()
  const [creating, setCreating] = useState(false)

  const openCreate = () => {
    create.reset()
    setCreating(true)
  }
  const newButton = (
    <Button onClick={openCreate}>
      <Plus className="size-4" />
      Новый проект
    </Button>
  )

  return (
    <>
      <PageHeader title="Проекты" subtitle="Проекты, где вы владелец или участник" actions={newButton} />

      {projects.isPending ? (
        <PageSpinner />
      ) : projects.isError ? (
        <ErrorState error={projects.error} onRetry={() => void projects.refetch()} />
      ) : projects.data.results.length === 0 ? (
        <EmptyState title="У вас пока нет проектов" hint="Создайте первый проект или попросите владельца добавить вас." action={newButton} />
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.data.results.map((p) => (
              <li key={p.id}>
                <ProjectCard project={p} />
              </li>
            ))}
          </ul>
          <Pager page={page} count={projects.data.count} onChange={(next) => setParams(next > 1 ? { page: String(next) } : {})} />
        </>
      )}

      <Modal open={creating} title="Новый проект" onClose={() => setCreating(false)}>
        <ProjectForm
          submitLabel="Создать"
          submitting={create.isPending}
          error={create.error}
          onCancel={() => setCreating(false)}
          onSubmit={(input) =>
            create.mutate(input, {
              onSuccess: (project) => {
                toast.success("Проект создан")
                setCreating(false)
                navigate(`/projects/${project.id}`)
              },
            })
          }
        />
      </Modal>
    </>
  )
}
