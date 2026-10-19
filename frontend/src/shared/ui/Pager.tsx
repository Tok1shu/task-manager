import { PAGE_SIZE } from "../api/types"
import { Button } from "./Button"

interface PagerProps {
  page: number
  count: number
  onChange: (page: number) => void
}

export function Pager({ page, count, onChange }: PagerProps) {
  const pages = Math.ceil(count / PAGE_SIZE)
  if (pages <= 1) return null
  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-sm text-subtle">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Назад
      </Button>
      <span>
        {page} из {pages}
      </span>
      <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Вперёд
      </Button>
    </div>
  )
}
