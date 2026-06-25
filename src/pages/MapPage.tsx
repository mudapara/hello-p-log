import { useEffect, useState } from 'react'
import { JapanMap } from '../components/JapanMap'
import { LogDetailModal } from '../components/LogDetailModal'
import { useLogs } from '../hooks/useLogs'
import { useAuth } from '../contexts/AuthContext'
import { seedAiLogsIfEmpty } from '../lib/logStore'
import { buildUserMistStyleMap } from '../lib/profileStore'
import type { FartLog } from '../types'
import './MapPage.css'

export function MapPage() {
  const { user } = useAuth()
  const { logs, loading, error, reload } = useLogs()
  const [filter, setFilter] = useState<'all' | 'ai' | 'user'>('all')
  const [selected, setSelected] = useState<FartLog | null>(null)
  const [seeded, setSeeded] = useState(false)
  const [userMistStyles, setUserMistStyles] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    void (async () => {
      await seedAiLogsIfEmpty()
      setSeeded(true)
      await reload()
    })()
  }, [reload])

  useEffect(() => {
    void buildUserMistStyleMap(logs, user?.id ?? null).then(setUserMistStyles)
  }, [logs, user?.id])

  const aiCount = logs.filter((l) => l.source === 'ai').length
  const userCount = logs.filter((l) => l.source === 'user').length

  return (
    <div className="map-page">
      <h1>日本マップ</h1>
      <p className="lead">
        ログ1件＝黄色い光る点1つ。増えるほど、日本が黄色く見えてきます。
      </p>

      <div className="stats">
        <span>総ログ: <strong>{logs.length}</strong></span>
        <span>AI: {aiCount}</span>
        <span>ユーザー: {userCount}</span>
      </div>

      <div className="filters">
        {(['all', 'ai', 'user'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={filter === f ? 'filter active' : 'filter'}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'すべて' : f === 'ai' ? 'AI' : 'ユーザー'}
          </button>
        ))}
      </div>

      {loading && !seeded && <p>読み込み中…</p>}
      {error && <p className="error">{error}</p>}

      <JapanMap
        logs={logs}
        filter={filter}
        onSelectLog={setSelected}
        height="480px"
        userMistStyles={userMistStyles}
      />

      {selected && <LogDetailModal log={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
