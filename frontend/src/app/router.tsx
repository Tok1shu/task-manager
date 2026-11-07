import { lazy, Suspense, type ReactNode } from "react"
import { Navigate, type RouteObject } from "react-router"
import { PageSpinner } from "@/shared/ui"
import { LoginPage, ProfilePage, RegisterPage } from "@/features/auth"
import { ProjectPage, ProjectsPage } from "@/features/projects"
import { MyTasksPage } from "@/features/tasks"
import { AppLayout } from "./layout/AppLayout"
import { GuestOnly, ProtectedRoute } from "./ProtectedRoute"

const TaskPage = lazy(() => import("./pages/TaskPage"))
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"))

const lazyPage = (node: ReactNode) => <Suspense fallback={<PageSpinner />}>{node}</Suspense>

// Прочие маршруты — только внутри ProtectedRoute (FR-05).
export const routes: RouteObject[] = [
  {
    element: <GuestOnly />,
    children: [
      { path: "/login", element: lazyPage(<LoginPage />) },
      { path: "/register", element: lazyPage(<RegisterPage />) },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <Navigate to="/projects" replace /> },
          { path: "/projects", element: <ProjectsPage /> },
          { path: "/projects/:projectId", element: <ProjectPage /> },
          { path: "/tasks/:taskId", element: <TaskPage /> },
          { path: "/my-tasks", element: <MyTasksPage /> },
          { path: "/profile", element: <ProfilePage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]
