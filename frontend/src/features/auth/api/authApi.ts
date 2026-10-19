import { api } from "@/shared/api/client"
import type { UserId } from "@/shared/api/ids"

export interface Me {
  id: UserId
  username: string
  email: string
  date_joined: string
}
export interface Credentials {
  username: string
  password: string
}
export interface RegisterInput extends Credentials {
  email: string
}

export const authApi = {
  register: (input: RegisterInput) =>
    api.post<{ id: UserId; username: string }>("/auth/register/", input, { auth: false }),
  login: (input: Credentials) => api.post<{ access: string }>("/auth/login/", input, { auth: false }),
  logout: () => api.post<void>("/auth/logout/", undefined, { auth: false }),
  me: () => api.get<Me>("/me/"),
  updateMe: (input: Partial<Pick<Me, "username" | "email">>) => api.patch<Me>("/me/", input),
}
