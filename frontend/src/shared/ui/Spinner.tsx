import { cn } from "../lib/cn"

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Загрузка"
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  )
}

export function PageSpinner() {
  return (
    <div className="flex justify-center py-16 text-accent-500">
      <Spinner className="size-6" />
    </div>
  )
}
