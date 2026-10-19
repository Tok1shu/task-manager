import type { ButtonHTMLAttributes } from "react"
import { cn } from "../lib/cn"
import { Spinner } from "./Spinner"

const VARIANTS = {
  primary: "bg-accent-600 text-white hover:bg-accent-500 disabled:hover:bg-accent-600",
  secondary: "bg-surface-elevated text-primary border border-border-input hover:bg-surface-hover",
  danger: "bg-danger-600 text-white hover:bg-danger-500 disabled:hover:bg-danger-600",
  ghost: "text-subtle hover:bg-surface-hover hover:text-primary",
} as const
const SIZES = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-sm" } as const

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS
  size?: keyof typeof SIZES
  loading?: boolean
}

export function Button({ variant = "primary", size = "md", loading, disabled, className, children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}
