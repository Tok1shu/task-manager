import { create } from "zustand"
import type { Me } from "../api/authApi"

type Status = "loading" | "authed" | "anon"

interface AuthState {
  status: Status
  user: Me | null
  setUser: (user: Me) => void
  setAnonymous: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  user: null,
  setUser: (user) => set({ status: "authed", user }),
  setAnonymous: () => set({ status: "anon", user: null }),
}))
