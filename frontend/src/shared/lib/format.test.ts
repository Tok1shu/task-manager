import { describe, expect, it } from "vitest"
import { formatDate, formatPercent, plural } from "./format"

describe("format", () => {
  it("дата без времени не сдвигается на сутки", () => {
    expect(formatDate("2026-10-19")).toContain("19")
  })
  it("пустая дата — прочерк", () => {
    expect(formatDate(null)).toBe("—")
  })
  it("процент: целые без дроби", () => {
    expect(formatPercent(30)).toBe("30%")
    expect(formatPercent(33.3)).toBe("33.3%")
  })
  it("склонение", () => {
    const f = (n: number) => plural(n, "задача", "задачи", "задач")
    expect([1, 2, 5, 11, 21, 22, 25].map(f)).toEqual(["задача", "задачи", "задач", "задач", "задача", "задачи", "задач"])
  })
})
