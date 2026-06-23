import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { submitContact } from '../lib/logStore'
import './ContactPage.css'

export function ContactPage() {
  const [params] = useSearchParams()
  const [type, setType] = useState<'report' | 'delete' | 'other'>(
    (params.get('type') as 'report' | 'delete' | 'other') || 'other',
  )
  const [logId, setLogId] = useState(params.get('id') ?? '')
  const [message, setMessage] = useState('')
  const [replyEmail, setReplyEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) {
      setError('内容を入力してください')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await submitContact({
        type,
        logId: logId.trim() || null,
        message: message.trim(),
        replyEmail: replyEmail.trim() || null,
      })
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="contact-page">
        <div className="sent-card">
          <h1>送信しました</h1>
          <p>内容を確認のうえ、対応することがあります。返信をお約束するものではありません。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="contact-page">
      <h1>お問い合わせ</h1>
      <p className="lead">通報・削除依頼・その他</p>

      <form onSubmit={(e) => void handleSubmit(e)} className="contact-form">
        <div className="field">
          <label htmlFor="type">種別</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            <option value="report">通報</option>
            <option value="delete">削除依頼</option>
            <option value="other">その他</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="logId">対象ログID（わかる場合）</label>
          <input
            id="logId"
            value={logId}
            onChange={(e) => setLogId(e.target.value)}
            placeholder="通報ボタンから自動入力されます"
          />
        </div>

        <div className="field">
          <label htmlFor="message">内容 *</label>
          <textarea
            id="message"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="email">返信用メール（任意）</label>
          <input
            id="email"
            type="email"
            value={replyEmail}
            onChange={(e) => setReplyEmail(e.target.value)}
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? '送信中…' : '送信'}
        </button>
      </form>
    </div>
  )
}
