import type { Plugin } from "vite"
import { handle } from "./handlers.ts"

// Dev-middleware Vite: отвечает на /api/* вместо настоящего бэкенда.
// Это настоящие HTTP-запросы (видны во вкладке Network), поэтому код фронтенда
// не знает про эмуляцию; при готовом бэкенде достаточно запустить с MOCK_API=0.
export function mockApi(): Plugin {
  return {
    name: "task-manager-mock-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next()
        const chunks: Buffer[] = []
        req.on("data", (c: Buffer) => chunks.push(c))
        req.on("end", () => {
          void handle(req, Buffer.concat(chunks).toString("utf8"), res)
        })
      })
    },
  }
}
