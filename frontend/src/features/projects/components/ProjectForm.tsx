import type { FormEvent } from "react"
import { fieldError } from "@/shared/api/client"
import { useFormValues } from "@/shared/hooks/useFormValues"
import { Button, Field, FormError, Input, Textarea } from "@/shared/ui"
import type { ProjectInput } from "../api/types"

interface Props {
  initial?: ProjectInput
  submitLabel: string
  submitting: boolean
  error: unknown
  onSubmit: (input: ProjectInput) => void
  onCancel: () => void
}

export function ProjectForm({ initial, submitLabel, submitting, error, onSubmit, onCancel }: Props) {
  const { values, bind } = useFormValues({ name: initial?.name ?? "", description: initial?.description ?? "" })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(values)
  }
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormError error={error} />
      <Field label="Название" error={fieldError(error, "name")} hint="От 3 до 120 символов">
        <Input autoFocus invalid={!!fieldError(error, "name")} {...bind("name")} />
      </Field>
      <Field label="Описание" error={fieldError(error, "description")}>
        <Textarea invalid={!!fieldError(error, "description")} {...bind("description")} />
      </Field>
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
