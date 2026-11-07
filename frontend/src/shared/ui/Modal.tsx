import { useEffect, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "../lib/cn"

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  className?: string
}

/** Один модальный компонент на всё приложение: Esc, клик по подложке, блокировка прокрутки, фокус внутрь. */
export function Modal({ open, title, onClose, children, className }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    panel.current?.focus()
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-border-strong bg-surface-panel p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl",
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-bright">{title}</h2>
          <button type="button" aria-label="Закрыть" onClick={onClose} className="rounded-md p-1 text-subtle hover:bg-surface-hover hover:text-primary">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
