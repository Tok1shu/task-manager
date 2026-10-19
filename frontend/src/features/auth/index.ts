import { lazy } from "react"

export const LoginPage = lazy(() => import("./pages/LoginPage"))
export const RegisterPage = lazy(() => import("./pages/RegisterPage"))
export const ProfilePage = lazy(() => import("./pages/ProfilePage"))

export { useLogout } from "./api/auth.queries"
export { useAuthStore } from "./model/authStore"
export { bootstrapSession, endSession } from "./model/session"
