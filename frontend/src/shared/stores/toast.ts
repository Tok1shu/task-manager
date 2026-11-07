import { create } from "zustand"

export type ToastKind = "success" | "error" | "info"
export interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

interface ToastState {
  items: ToastItem[]
  push: (kind: ToastKind, message: string) => void
  dismiss: (id: number) => void
}

let nextId = 1
export const useToastStore = create<ToastState>((set, get) => ({
  items: [],
  push: (kind, message) => {
    const id = nextId++
    set((s) => ({ items: [...s.items, { id, kind, message }] }))
    setTimeout(() => get().dismiss(id), 4000)
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}))

/** Единый способ показать результат действия (UI-04). */
export const toast = {
  success: (message: string) => useToastStore.getState().push("success", message),
  error: (message: string) => useToastStore.getState().push("error", message),
  info: (message: string) => useToastStore.getState().push("info", message),
}
