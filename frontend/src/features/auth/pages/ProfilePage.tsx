import type { FormEvent } from "react"
import { fieldError } from "@/shared/api/client"
import { useFormValues } from "@/shared/hooks/useFormValues"
import { formatDate } from "@/shared/lib/format"
import { toast } from "@/shared/stores/toast"
import { Button, Card, Field, FormError, Input, PageHeader } from "@/shared/ui"
import { useUpdateProfile } from "../api/auth.queries"
import { useAuthStore } from "../model/authStore"

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)!
  const update = useUpdateProfile()
  const { values, bind } = useFormValues({ username: user.username, email: user.email })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    update.mutate(values, { onSuccess: () => toast.success("Профиль сохранён") })
  }

  return (
    <>
      <PageHeader title="Профиль" subtitle={`В системе с ${formatDate(user.date_joined)}`} />
      <Card className="max-w-md p-5">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormError error={update.error} />
          <Field label="Имя пользователя" error={fieldError(update.error, "username")}>
            <Input invalid={!!fieldError(update.error, "username")} {...bind("username")} />
          </Field>
          <Field label="Email" error={fieldError(update.error, "email")}>
            <Input type="email" invalid={!!fieldError(update.error, "email")} {...bind("email")} />
          </Field>
          <Button type="submit" loading={update.isPending}>
            Сохранить
          </Button>
        </form>
      </Card>
    </>
  )
}
