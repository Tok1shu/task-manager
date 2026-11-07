import { lazy } from "react"

export const ProjectsPage = lazy(() => import("./pages/ProjectsPage"))
export const ProjectPage = lazy(() => import("./pages/ProjectPage"))

export { useProject } from "./api/projects.queries"
