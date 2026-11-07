import { useMutation } from "@tanstack/react-query"
import { authApi } from "./authApi"
import { useAuthStore } from "../model/authStore"
import { endSession, startSession } from "../model/session"

export function useLogin() {
  return useMutation({
    mutationFn: async (input: Parameters<typeof authApi.login>[0]) => {
      const { access } = await authApi.login(input)
      await startSession(access)
    },
  })
}

export const useRegister = () => useMutation({ mutationFn: authApi.register })

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout()
      } finally {
        endSession()
      }
    },
  })
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({ mutationFn: authApi.updateMe, onSuccess: setUser })
}
