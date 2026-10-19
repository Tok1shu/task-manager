import { QueryClientProvider } from "@tanstack/react-query"
import { createBrowserRouter, RouterProvider } from "react-router"
import { queryClient } from "@/shared/api/queryClient"
import { GlobalConfirm, ToastHost } from "@/shared/ui"
import { routes } from "./router"

const router = createBrowserRouter(routes)

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <GlobalConfirm />
      <ToastHost />
    </QueryClientProvider>
  )
}
