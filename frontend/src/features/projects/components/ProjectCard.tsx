import { Link } from "react-router"
import { ListChecks, Users } from "lucide-react"
import { Badge, Card } from "@/shared/ui"
import type { Project } from "../api/types"

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link to={`/projects/${project.id}`} className="block h-full">
      <Card className="flex h-full flex-col p-4 transition-colors hover:border-border-hover hover:bg-surface-elevated">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium break-words text-bright">{project.name}</h3>
          <Badge tone={project.role === "owner" ? "accent" : "neutral"}>
            {project.role === "owner" ? "Владелец" : "Участник"}
          </Badge>
        </div>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-subtle">{project.description || "Без описания"}</p>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <ListChecks className="size-3.5" />
            {project.tasks_count}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" />
            {project.members_count}
          </span>
          {project.role === "member" && <span className="ml-auto">Владелец: {project.owner.username}</span>}
        </div>
      </Card>
    </Link>
  )
}
