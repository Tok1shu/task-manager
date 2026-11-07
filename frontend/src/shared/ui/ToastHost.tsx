import { CheckCircle2, Info, XCircle } from "lucide-react"
import { useToastStore, type ToastKind } from "../stores/toast"
import { cn } from "../lib/cn"

const STYLE: Record<ToastKind, { icon: typeof Info; cls: string }> = {
  success: { icon: CheckCircle2, cls: "border-accent-700 text-accent-300" },
  error: { icon: XCircle, cls: "border-danger-700 text-danger-300" },
  info: { icon: Info, cls: "border-border-hover text-secondary" },
}

export function ToastHost() {
  const items = useToastStore((s) => s.items)
  const dismiss = useToastStore((s) => s.dismiss)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
      {items.map((t) => {
        const { icon: Icon, cls } = STYLE[t.kind]
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => dismiss(t.id)}
            className={cn("pointer-events-auto flex max-w-sm items-center gap-2 rounded-lg border bg-surface-elevated px-4 py-2.5 text-left text-sm shadow-lg", cls)}
          >
            <Icon className="size-4 shrink-0" />
            <span className="text-primary">{t.message}</span>
          </button>
        )
      })}
    </div>
  )
}
