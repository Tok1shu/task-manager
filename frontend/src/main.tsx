import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { onUnauthorized } from "@/shared/api/client"
import { bootstrapSession, endSession } from "@/features/auth"
import { App } from "./app/App"
import "./index.css"

// Потеря сессии в любой момент (refresh не удался) возвращает на страницу входа.
onUnauthorized(endSession)
void bootstrapSession()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
