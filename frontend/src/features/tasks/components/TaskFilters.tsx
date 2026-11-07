import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import type { UserRef } from "@/shared/api/types"
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue"
import { Button, Input, Select } from "@/shared/ui"
import type { TaskFilters as Filters } from "../api/types"
import { TASK_ORDERINGS, TASK_PRIORITIES, TASK_STATUSES } from "../constants"

interface Props {
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
  onReset: () => void
  canReset: boolean
  /** Если передать участников, появится фильтр по исполнителю. */
  members?: UserRef[]
}

export function TaskFilters({ filters, onChange, onReset, canReset, members }: Props) {
  const [text, setText] = useState(filters.search)
  const debounced = useDebouncedValue(text)

  useEffect(() => {
    if (debounced !== filters.search) onChange({ search: debounced })
  }, [debounced])

  // сброс извне (кнопка «Сбросить», «назад» в браузере) обновляет поле поиска;
  // собственное изменение (filters.search === debounced) поле не трогает
  useEffect(() => {
    if (filters.search !== debounced) setText(filters.search)
  }, [filters.search])

  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div className="relative col-span-full">
        <Search className="pointer-events-none absolute top-3 left-3 size-4 text-faint" />
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Поиск по названию"
          aria-label="Поиск по названию"
          className="pl-9"
        />
      </div>
      <Select aria-label="Статус" value={filters.status} onChange={(e) => onChange({ status: e.target.value as Filters["status"] })}>
        <option value="">Любой статус</option>
        {TASK_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </Select>
      <Select aria-label="Приоритет" value={filters.priority} onChange={(e) => onChange({ priority: e.target.value as Filters["priority"] })}>
        <option value="">Любой приоритет</option>
        {TASK_PRIORITIES.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </Select>
      {members && (
        <Select aria-label="Исполнитель" value={filters.assignee} onChange={(e) => onChange({ assignee: e.target.value })}>
          <option value="">Любой исполнитель</option>
          <option value="none">Без исполнителя</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.username}</option>
          ))}
        </Select>
      )}
      <Select aria-label="Сортировка" value={filters.ordering} onChange={(e) => onChange({ ordering: e.target.value })}>
        {TASK_ORDERINGS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>
      {canReset && (
        <Button variant="ghost" onClick={onReset} className="col-span-full sm:col-span-1">
          Сбросить
        </Button>
      )}
    </div>
  )
}
