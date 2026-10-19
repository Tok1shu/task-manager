import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router"
import { fieldError } from "@/shared/api/client"
import { useFormValues } from "@/shared/hooks/useFormValues"
import { toast } from "@/shared/stores/toast"
import { Button, Field, FormError, Input } from "@/shared/ui"
import { useRegister } from "../api/auth.queries"
import { AuthCard } from "../components/AuthCard"

export default function RegisterPage() {
  const navigate = useNavigate()
  const register = useRegister()
  const { values, bind } = useFormValues({ username: "", email: "", password: "" })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    register.mutate(values, {
      onSuccess: () => {
        toast.success("Аккаунт создан. Теперь войдите.")
        navigate("/login", { replace: true })
      },
    })
  }

  return (
    <AuthCard
      title="Регистрация"
      subtitle="Создайте аккаунт Task Manager"
      footer={<>Уже есть аккаунт? <Link to="/login" className="text-accent-400 hover:underline">Войти</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormError error={register.error} />
        <Field label="Имя пользователя" error={fieldError(register.error, "username")}>
          <Input autoComplete="username" autoFocus invalid={!!fieldError(register.error, "username")} {...bind("username")} />
        </Field>
        <Field label="Email" error={fieldError(register.error, "email")}>
          <Input type="email" autoComplete="email" invalid={!!fieldError(register.error, "email")} {...bind("email")} />
        </Field>
        <Field label="Пароль" error={fieldError(register.error, "password")} hint="Минимум 8 символов">
          <Input type="password" autoComplete="new-password" invalid={!!fieldError(register.error, "password")} {...bind("password")} />
        </Field>
        <Button type="submit" className="w-full" loading={register.isPending}>
          Зарегистрироваться
        </Button>
      </form>
    </AuthCard>
  )
}
