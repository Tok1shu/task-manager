import type { ReactNode } from "react"
import { cn } from "../lib/cn"

const TONES = {
  neutral: "bg-surface-hover text-subtle",
  accent: "bg-accent-950 text-accent-400",
  info: "bg-info-400/15 text-info-400",
  warning: "bg-warning-950 text-warning-400",
  danger: "bg-danger-950 text-danger-400",
} as const
export type BadgeTone = keyof typeof TONES

export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", TONES[tone], className)}>
      {children}
    </span>
  )
}
