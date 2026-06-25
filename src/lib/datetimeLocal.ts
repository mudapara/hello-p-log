/** datetime-local 入力用（ローカルタイムゾーン） */
export function toDatetimeLocalValue(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return nowDatetimeLocalValue()
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

export function nowDatetimeLocalValue(): string {
  return toDatetimeLocalValue(new Date())
}
