import type { FartLog } from '../types'

const MY_LOG_IDS_KEY = 'hello-p-log:my-log-ids'

export function getMyLogIds(): string[] {
  try {
    const raw = localStorage.getItem(MY_LOG_IDS_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function trackMyLogId(id: string): void {
  const ids = getMyLogIds()
  if (!ids.includes(id)) {
    localStorage.setItem(MY_LOG_IDS_KEY, JSON.stringify([id, ...ids]))
  }
}

export function removeMyLogId(id: string): void {
  localStorage.setItem(
    MY_LOG_IDS_KEY,
    JSON.stringify(getMyLogIds().filter((existing) => existing !== id)),
  )
}

export function canManageLog(log: FartLog, userId: string | null): boolean {
  if (log.source !== 'user') return false
  if (userId && log.userId === userId) return true
  if (!log.userId && getMyLogIds().includes(log.id)) return true
  return false
}
