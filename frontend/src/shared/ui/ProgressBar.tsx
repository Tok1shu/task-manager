export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className="h-2 overflow-hidden rounded-full bg-surface-sunken"
    >
      <div className="h-full rounded-full bg-accent-500 transition-[width]" style={{ width: `${value}%` }} />
    </div>
  )
}
