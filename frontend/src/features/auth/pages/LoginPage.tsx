import type { FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { fieldError } from "@/shared/api/client"
import { useFormValues } from "@/shared/hooks/useFormValues"
import { Button, Field, FormError, Input } from "@/shared/ui"
import { useLogin } from "../api/auth.queries"
import { AuthCard } from "../components/AuthCard"

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation() as { state: { from?: string } | null }
  const login = useLogin()
  const { values, bind } = useFormValues({ username: "", password: "" })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    login.mutate(values, { onSuccess: () => navigate(location.state?.from ?? "/projects", { replace: true }) })
  }

  return (
    <AuthCard
      title="Вход"
      subtitle="Войдите, чтобы работать с проектами"
      footer={<>Нет аккаунта? <Link to="/register" className="text-accent-400 hover:underline">Зарегистрироваться</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormError error={login.error} />
        <Field label="Имя пользователя" error={fieldError(login.error, "username")}>
          <Input autoComplete="username" autoFocus {...bind("username")} />
        </Field>
        <Field label="Пароль" error={fieldError(login.error, "password")}>
          <Input type="password" autoComplete="current-password" {...bind("password")} />
        </Field>
        <Button type="submit" className="w-full" loading={login.isPending}>
          Войти
        </Button>
      </form>
    </AuthCard>
  )
}
