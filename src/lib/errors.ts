export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error) return error
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    if (typeof record.message === 'string' && record.message) return record.message
    if (typeof record.msg === 'string' && record.msg) return record.msg
    if (typeof record.error_description === 'string' && record.error_description) {
      return record.error_description
    }
    try {
      const json = JSON.stringify(error)
      if (json && json !== '{}') return json
    } catch {
      // ignore
    }
  }
  return fallback
}
