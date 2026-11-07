import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { mockApi } from "./mock/plugin.ts"

// MOCK_API=0 отключает эмулятор и проксирует /api на настоящий бэкенд (API_PROXY_TARGET).
const useMock = process.env.MOCK_API !== "0"
const apiTarget = process.env.API_PROXY_TARGET ?? "http://localhost:8000"

export default defineConfig({
  plugins: [react(), tailwindcss(), useMock ? mockApi() : null],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    host: true,
    allowedHosts: true,
    port: 5173,
    proxy: useMock ? undefined : { "/api": apiTarget },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
})
