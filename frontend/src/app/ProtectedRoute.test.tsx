import { beforeEach, describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import { useAuthStore } from "@/features/auth"
import type { UserId } from "@/shared/api/ids"
import { GuestOnly, ProtectedRoute } from "./ProtectedRoute"

const ui = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<p>страница входа</p>} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/projects" element={<p>список проектов</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

const me = { id: "u1" as UserId, username: "ivan", email: "ivan@example.com", date_joined: "2026-01-01T00:00:00Z" }

describe("защита маршрутов (FR-05)", () => {
  beforeEach(() => useAuthStore.setState({ status: "anon", user: null }))

  it("аноним на закрытой странице попадает на вход", () => {
    ui("/projects")
    expect(screen.getByText("страница входа")).toBeInTheDocument()
  })

  it("вошедший видит закрытую страницу", () => {
    useAuthStore.getState().setUser(me)
    ui("/projects")
    expect(screen.getByText("список проектов")).toBeInTheDocument()
  })

  it("вошедшего со страницы входа отправляет к проектам", () => {
    useAuthStore.getState().setUser(me)
    ui("/login")
    expect(screen.getByText("список проектов")).toBeInTheDocument()
  })
})
