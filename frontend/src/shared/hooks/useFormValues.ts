import { useState, type ChangeEvent } from "react"

type StringKeys<T> = { [K in keyof T]: T[K] extends string ? K : never }[keyof T]
type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

/** Состояние формы + `bind(name)` для input/textarea/select. Один способ вести формы во всём приложении. */
export function useFormValues<T extends object>(initial: T) {
  const [values, setValues] = useState(initial)
  const set = <K extends keyof T>(key: K, value: T[K]) => setValues((v) => ({ ...v, [key]: value }))
  const bind = (key: StringKeys<T>) => ({
    name: String(key),
    value: values[key] as string,
    onChange: (e: ChangeEvent<Control>) => set(key, e.target.value as T[typeof key]),
  })
  return { values, set, bind, reset: () => setValues(initial) }
}
