import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react"
import { cn } from "../lib/cn"

const CONTROL =
  "w-full rounded-lg border bg-surface-elevated px-3 text-sm text-primary placeholder:text-faint " +
  "transition-colors focus:border-accent-500 focus:outline-none disabled:opacity-50"

const controlClass = (invalid: boolean | undefined, extra?: string) =>
  cn(CONTROL, invalid ? "border-danger-500" : "border-border-input hover:border-border-hover", extra)

interface FieldProps {
  label: string
  error?: string
  hint?: string
  children: ReactNode
}

/** Подпись + контрол + ошибка валидации рядом с полем (UI-03). Один обёрточный компонент для всех форм. */
export function Field({ label, error, hint, children }: FieldProps) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-secondary">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="block text-xs text-danger-400">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  )
}

type Invalid = { invalid?: boolean }

export function Input({ invalid, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & Invalid) {
  return <input className={controlClass(invalid, cn("h-10", className))} aria-invalid={invalid} {...rest} />
}

export function Textarea({ invalid, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & Invalid) {
  return <textarea rows={4} className={controlClass(invalid, cn("resize-y py-2", className))} aria-invalid={invalid} {...rest} />
}

export function Select({ invalid, className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & Invalid) {
  return (
    <select className={controlClass(invalid, cn("h-10", className))} aria-invalid={invalid} {...rest}>
      {children}
    </select>
  )
}
