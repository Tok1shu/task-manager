import type { ComponentType } from "react"
import { FolderKanban, ListTodo, UserRound } from "lucide-react"

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
}

// Одно место, из которого строятся и верхняя навигация, и нижняя панель на телефоне.
export const NAV_ITEMS: NavItem[] = [
  { to: "/projects", label: "Проекты", icon: FolderKanban },
  { to: "/my-tasks", label: "Мои задачи", icon: ListTodo },
  { to: "/profile", label: "Профиль", icon: UserRound },
]
