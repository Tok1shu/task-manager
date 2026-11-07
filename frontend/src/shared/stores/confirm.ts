import { create } from "zustand"

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  danger?: boolean
}
interface ConfirmState {
  request: (ConfirmOptions & { resolve: (ok: boolean) => void }) | null
  close: (ok: boolean) => void
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  request: null,
  close: (ok) => {
    get().request?.resolve(ok)
    set({ request: null })
  },
}))

/** Вместо window.confirm: `if (await confirm({ title: "Удалить?", danger: true })) …` */
export const confirm = (options: ConfirmOptions) =>
  new Promise<boolean>((resolve) => useConfirmStore.setState({ request: { ...options, resolve } }))
