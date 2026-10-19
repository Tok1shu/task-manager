import type { UserId } from "./ids"

export interface UserRef {
  id: UserId
  username: string
}

export interface Page<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const PAGE_SIZE = 20
