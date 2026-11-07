import type { FormEvent } from "react"
import { fieldError } from "@/shared/api/client"
import type { UserId } from "@/shared/api/ids"
import type { UserRef } from "@/shared/api/types"
import { useFormValues } from "@/shared/hooks/useFormValues"
import { Button, Field, FormError, Input, Select, Textarea } from "@/shared/ui"
import type { Task, TaskInput, TaskPriority, TaskStatus } from "../api/types"
import { TASK_PRIORITIES, TASK_STATUSES } from "../constants"

interface Props {
  /** Задача для редактирования; без неё форма создаёт новую. */
  initial?: Task
  /** Допустимые исполнители: владелец и участники проекта. */
  members: UserRef[]
  submitLabel: string
  submitting: boolean
  error: unknown
  onSubmit: (input: TaskInput) => void
  onCancel: () => void
}

export function TaskForm({ initial, members, submitLabel, submitting, error, onSubmit, onCancel }: Props) {
  const { values, bind } = useFormValues({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    assignee: initial?.assignee?.id ?? "",
    status: initial?.status ?? "todo",
    priority: initial?.priority ?? "medium",
    due_date: initial?.due_date ?? "",
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({
      title: values.title,
      description: values.description,
      assignee: (values.assignee || null) as UserId | null,
      status: values.status as TaskStatus,
      priority: values.priority as TaskPriority,
      due_date: values.due_date || null,
    })
  }
  const err = (name: string) => fieldError(error, name)

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormError error={error} />
      <Field label="Название" error={err("title")} hint="От 3 до 150 символов">
        <Input autoFocus invalid={!!err("title")} {...bind("title")} />
      </Field>
      <Field label="Описание" error={err("description")}>
        <Textarea invalid={!!err("description")} {...bind("description")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Исполнитель" error={err("assignee")}>
          <Select invalid={!!err("assignee")} {...bind("assignee")}>
            <option value="">Не назначен</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.username}</option>
            ))}
          </Select>
        </Field>
        <Field label="Срок выполнения" error={err("due_date")}>
          <Input type="date" invalid={!!err("due_date")} {...bind("due_date")} />
        </Field>
        <Field label="Статус" error={err("status")}>
          <Select {...bind("status")}>
            {TASK_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Приоритет" error={err("priority")}>
          <Select {...bind("priority")}>
            {TASK_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
