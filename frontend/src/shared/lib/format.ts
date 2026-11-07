const date = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" })
const dateTime = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
})

/** `YYYY-MM-DD` или ISO-время → «19 окт. 2026». */
export const formatDate = (value: string | null | undefined) => {
  if (!value) return "—"
  // дату без времени читаем как локальную, иначе она «съезжает» на сутки
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value)
  return date.format(d)
}
export const formatDateTime = (value: string) => dateTime.format(new Date(value))

export const formatPercent = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(1)}%`

/** 1 задача, 2 задачи, 5 задач. */
export function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}
