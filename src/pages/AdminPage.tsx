import { useState } from 'react'
import { deleteLog, fetchAllLogs, getAdminPassword } from '../lib/logStore'
import type { FartLog } from '../types'
import { formatDateTime } from '../lib/geo'
import './AdminPage.css'

export function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [logs, setLogs] = useState<FartLog[]>([])
  const [error, setError] = useState<string | null>(null)

  const login = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === getAdminPassword()) {
      setAuthed(true)
      void load()
    } else {
      setError('パスワードが違います')
    }
  }

  const load = async () => {
    const data = await fetchAllLogs()
    setLogs(data)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このログを削除しますか？')) return
    await deleteLog(id)
    await load()
  }

  if (!authed) {
    return (
      <div className="admin-page">
        <h1>管理</h1>
        <form onSubmit={login} className="admin-login">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="管理パスワード"
          />
          <button type="submit" className="btn btn-primary">ログイン</button>
          {error && <p className="error">{error}</p>}
        </form>
        <p className="hint">.env の VITE_ADMIN_PASSWORD で変更できます</p>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <h1>ログ管理</h1>
      <button type="button" className="btn" onClick={() => void load()}>更新</button>
      <ul className="admin-list">
        {logs.map((log) => (
          <li key={log.id}>
            <div>
              <strong>{log.nickname}</strong>
              <span className={`badge-sm badge-${log.source}`}>
                {log.source === 'ai' ? 'AI' : 'ユーザー'}
              </span>
              <br />
              <small>{formatDateTime(log.loggedAt)} · {log.mainComponent}</small>
              <br />
              <code className="log-id">{log.id}</code>
            </div>
            <button type="button" className="btn btn-danger" onClick={() => void handleDelete(log.id)}>
              削除
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
