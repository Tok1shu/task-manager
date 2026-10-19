import { Suspense } from "react"
import { NavLink, Outlet, useNavigate } from "react-router"
import { CheckSquare, LogOut } from "lucide-react"
import { cn } from "@/shared/lib/cn"
import { PageSpinner } from "@/shared/ui"
import { useAuthStore, useLogout } from "@/features/auth"
import { NAV_ITEMS } from "./navItems"

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
    isActive ? "bg-surface-active text-bright" : "text-subtle hover:bg-surface-hover hover:text-primary",
  )

export function AppLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const navigate = useNavigate()

  const onLogout = () => logout.mutate(undefined, { onSettled: () => navigate("/login", { replace: true }) })

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border-subtle bg-surface-panel/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <NavLink to="/projects" className="flex items-center gap-2 font-semibold text-bright">
            <CheckSquare className="size-5 text-accent-500" />
            Task Manager
          </NavLink>
          <nav className="ml-4 hidden gap-1 md:flex" aria-label="Основная навигация">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={linkClass}>
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 text-sm text-subtle">
            <span className="max-w-32 truncate">{user?.username}</span>
            <button
              type="button"
              aria-label="Выйти"
              title="Выйти"
              onClick={onLogout}
              className="rounded-lg p-2 hover:bg-surface-hover hover:text-primary"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Suspense fallback={<PageSpinner />}>
          <Outlet />
        </Suspense>
      </main>

      <nav
        aria-label="Основная навигация"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-border-subtle bg-surface-panel md:hidden"
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn("flex flex-col items-center gap-0.5 py-2 text-xs", isActive ? "text-accent-400" : "text-subtle")
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
