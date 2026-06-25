const LOCAL_USER_ID_KEY = 'hello-p-log:local-user-id'
const LOCAL_USER_ID_PREFIX = 'local:'

export function isLocalUserId(userId: string): boolean {
  return userId.startsWith(LOCAL_USER_ID_PREFIX)
}

export function getOrCreateLocalUserId(): string {
  try {
    const existing = localStorage.getItem(LOCAL_USER_ID_KEY)
    if (existing) return existing
    const id = `${LOCAL_USER_ID_PREFIX}${crypto.randomUUID()}`
    localStorage.setItem(LOCAL_USER_ID_KEY, id)
    return id
  } catch {
    return `${LOCAL_USER_ID_PREFIX}fallback`
  }
}

/** ログイン時は auth ID、未ログイン時はこの端末用のローカル ID */
export function getProfileUserId(authUserId: string | null | undefined): string {
  if (authUserId) return authUserId
  return getOrCreateLocalUserId()
}
