import type { ProjectId } from "@/shared/api/ids"
import type { UserRef } from "@/shared/api/types"

export interface Project {
  id: ProjectId
  name: string
  description: string
  owner: UserRef
  /** роль текущего пользователя */
  role: "owner" | "member"
  members_count: number
  tasks_count: number
  created_at: string
}

export interface ProjectMember extends UserRef {
  is_owner: boolean
}

export interface ProjectDetail extends Project {
  members: ProjectMember[]
  permissions: { can_edit: boolean; can_delete: boolean; can_manage_members: boolean }
}

export interface ProjectStats {
  total: number
  todo: number
  in_progress: number
  done: number
  overdue: number
  done_percent: number
}

export interface ProjectInput {
  name: string
  description: string
}
