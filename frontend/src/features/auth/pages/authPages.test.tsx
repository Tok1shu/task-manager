import { describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ApiError } from "@/shared/api/client"
import { renderWithProviders } from "@/test/renderWithProviders"
import { authApi } from "../api/authApi"
import LoginPage from "./LoginPage"
import RegisterPage from "./RegisterPage"

vi.mock("../api/authApi", () => ({
  authApi: { login: vi.fn(), register: vi.fn(), me: vi.fn(), logout: vi.fn(), updateMe: vi.fn() },
}))

describe("страницы входа и регистрации", () => {
  it("вход: неверный пароль показывает общую ошибку", async () => {
    vi.mocked(authApi.login).mockRejectedValue(new ApiError(401, "Неверное имя пользователя или пароль"))
    renderWithProviders(<LoginPage />)

    await userEvent.type(screen.getByLabelText("Имя пользователя"), "ivan")
    await userEvent.type(screen.getByLabelText("Пароль"), "wrong")
    await userEvent.click(screen.getByRole("button", { name: "Войти" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Неверное имя пользователя или пароль")
  })

  it("регистрация: ошибка поля показывается рядом с полем (UI-03)", async () => {
    vi.mocked(authApi.register).mockRejectedValue(
      new ApiError(400, "Проверьте поля формы.", { email: ["Этот email уже используется."] }),
    )
    renderWithProviders(<RegisterPage />)

    await userEvent.type(screen.getByLabelText("Имя пользователя"), "newuser")
    await userEvent.type(screen.getByLabelText("Email"), "taken@example.com")
    await userEvent.type(screen.getByLabelText(/Пароль/), "password123")
    await userEvent.click(screen.getByRole("button", { name: "Зарегистрироваться" }))

    expect(await screen.findByText("Этот email уже используется.")).toBeInTheDocument()
    // общий блок ошибок не дублирует ошибку поля
    expect(screen.queryByText("Проверьте поля формы.")).not.toBeInTheDocument()
  })
})
