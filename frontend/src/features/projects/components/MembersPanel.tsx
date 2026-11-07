import type { FormEvent } from "react"
import { UserMinus } from "lucide-react"
import { fieldError } from "@/shared/api/client"
import { useFormValues } from "@/shared/hooks/useFormValues"
import { confirm } from "@/shared/stores/confirm"
import { toast } from "@/shared/stores/toast"
import { Badge, Button, Card, Field, FormError, Input } from "@/shared/ui"
import { useAddMember, useRemoveMember } from "../api/projects.queries"
import type { ProjectDetail } from "../api/types"

/** Участники проекта; добавлять и исключать может только владелец (FR-10). */
export function MembersPanel({ project }: { project: ProjectDetail }) {
  const add = useAddMember(project.id)
  const remove = useRemoveMember(project.id)
  const { values, bind, reset } = useFormValues({ username: "" })
  const canManage = project.permissions.can_manage_members

  const submit = (e: FormEvent) => {
    e.preventDefault()
    add.mutate(values.username, {
      onSuccess: (user) => {
        toast.success(`${user.username} добавлен в проект`)
        reset()
      },
    })
  }

  const onRemove = async (member: ProjectDetail["members"][number]) => {
    const ok = await confirm({
      title: `Исключить ${member.username}?`,
      message: "Задачи участника останутся в проекте без исполнителя.",
      confirmLabel: "Исключить",
      danger: true,
    })
    if (!ok) return
    remove.mutate(member.id, {
      onSuccess: () => toast.success("Участник исключён"),
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <Card className="p-4">
      <h2 className="mb-3 font-semibold text-bright">Участники ({project.members.length})</h2>
      <ul className="space-y-1">
        {project.members.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-hover">
            <span className="flex items-center gap-2 text-sm text-primary">
              {m.username}
              {m.is_owner && <Badge tone="accent">Владелец</Badge>}
            </span>
            {canManage && !m.is_owner && (
              <button
                type="button"
                aria-label={`Исключить ${m.username}`}
                onClick={() => void onRemove(m)}
                className="rounded p-1 text-faint hover:text-danger-400"
              >
                <UserMinus className="size-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {canManage && (
        <form onSubmit={submit} className="mt-4 space-y-2 border-t border-border-subtle pt-4" noValidate>
          <FormError error={add.error} />
          <Field label="Добавить по имени пользователя" error={fieldError(add.error, "username")}>
            <div className="flex gap-2">
              <Input placeholder="например, petr" invalid={!!fieldError(add.error, "username")} {...bind("username")} />
              <Button type="submit" loading={add.isPending} disabled={!values.username.trim()}>
                Добавить
              </Button>
            </div>
          </Field>
        </form>
      )}
    </Card>
  )
}
