import { useCallback, useEffect, useState } from 'react'
import type { FartLog } from '../types'
import { fetchAllLogs } from '../lib/logStore'

export function useLogs() {
  const [logs, setLogs] = useState<FartLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAllLogs()
      setLogs(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ログの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { logs, loading, error, reload }
}
