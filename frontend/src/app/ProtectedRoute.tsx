import { Navigate, Outlet, useLocation } from "react-router"
import { PageSpinner } from "@/shared/ui"
import { useAuthStore } from "@/features/auth"

/** FR-05: без входа доступны только регистрация и вход. */
export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status)
  const location = useLocation()
  if (status === "loading") return <PageSpinner />
  if (status === "anon") return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}

/** Страницы входа и регистрации не нужны уже вошедшему пользователю. */
export function GuestOnly() {
  const status = useAuthStore((s) => s.status)
  if (status === "loading") return <PageSpinner />
  if (status === "authed") return <Navigate to="/projects" replace />
  return <Outlet />
}
