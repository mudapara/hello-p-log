import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { formDataToLog, UserLogForm } from '../components/UserLogForm'
import { useAuth } from '../contexts/AuthContext'
import { canManageLog } from '../lib/myLogs'
import { fetchLogById, updateLog } from '../lib/logStore'
import type { FartLog } from '../types'
import './NewLogPage.css'

export function EditLogPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, authAvailable } = useAuth()
  const [log, setLog] = useState<FartLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!id) return
    void (async () => {
      try {
        const data = await fetchLogById(id)
        if (!data || data.source !== 'user') {
          setError('ログが見つかりません')
          return
        }
        if (!canManageLog(data, user?.id ?? null)) {
          setError('このログを編集する権限がありません')
          return
        }
        setLog(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : '読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, user?.id])

  const handleSubmit = async (data: Parameters<typeof formDataToLog>[0]) => {
    if (!log) return
    const updated = formDataToLog(data, {
      id: log.id,
      createdAt: log.createdAt,
      userId: log.userId ?? user?.id ?? null,
    })
    await updateLog(updated, user?.id ?? null)
    setSaved(true)
  }

  if (authAvailable && !user) {
    return <Navigate to="/login" replace />
  }

  if (loading) {
    return (
      <div className="new-log-page">
        <p className="hint">読み込み中…</p>
      </div>
    )
  }

  if (error || !log) {
    return (
      <div className="new-log-page">
        <p className="error">{error ?? 'ログが見つかりません'}</p>
        <Link to="/my-logs" className="btn">マイ屁ログへ戻る</Link>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="new-log-page">
        <div className="success-card">
          <h1>更新しました</h1>
          <p>変更がマップに反映されます。</p>
          <div className="success-actions">
            <Link to="/my-logs" className="btn btn-primary">マイ屁ログへ</Link>
            <Link to="/map" className="btn">マップを見る</Link>
          </div>
        </div>
      </div>
    )
  }

  const mode = log.photoDataUrl ? 'with_photo' : 'log_only'

  return (
    <div className="new-log-page">
      <button type="button" className="back-link" onClick={() => navigate('/my-logs')}>
        ← マイ屁ログへ
      </button>
      <h1>ログを編集</h1>
      {mode === 'with_photo' && log.photoDataUrl && (
        <img src={log.photoDataUrl} alt="投稿写真" className="photo-preview" />
      )}
      <UserLogForm
        mode={mode}
        photoDataUrl={log.photoDataUrl}
        initialLog={log}
        submitLabel="変更を保存"
        onSubmit={handleSubmit}
      />
    </div>
  )
}
