import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { APP_NAME } from '../lib/constants'
import './LoginPage.css'

function formatAuthError(message: string): string {
  if (message.includes('provider is not enabled')) {
    return 'Googleログインはまだ有効になっていません。メールアドレスでのログインをお試しください。'
  }
  return message
}

export function LoginPage() {
  const { user, authAvailable, signInWithGoogle, signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!authAvailable) {
    return (
      <div className="login-page">
        <h1>ログイン</h1>
        <p>この環境ではログイン機能が有効になっていません。</p>
        <Link to="/my-logs" className="btn">マイ屁ログへ戻る</Link>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/my-logs" replace />
  }

  const handleGoogle = async () => {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'Googleログインに失敗しました'
      setError(formatAuthError(raw))
      setLoading(false)
    }
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('メールアドレスを入力してください')
      return
    }
    setLoading(true)
    setError(null)
    const result = await signInWithEmail(email.trim())
    setLoading(false)
    if (result.error) {
      setError(formatAuthError(result.error))
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="login-page">
        <h1>メールを確認してください</h1>
        <p>
          <strong>{email}</strong> にログイン用リンクを送りました。
          メール内のリンクをタップすると、マイ屁ログ画面に戻ります。
        </p>
        <p className="hint">
          メールの件名や本文が英語の場合があります（送信元は {APP_NAME} のログイン機能です）。
          リンクが開けないときは、ブラウザで {APP_NAME} を開き直してからもう一度お試しください。
        </p>
        <Link to="/my-logs" className="btn">マイ屁ログへ</Link>
      </div>
    )
  }

  return (
    <div className="login-page">
      <h1>ログイン</h1>
      <p className="lead">Googleアカウントまたはメールアドレスでログインできます。</p>

      <button
        type="button"
        className="btn btn-google"
        disabled={loading}
        onClick={() => void handleGoogle()}
      >
        Googleでログイン
      </button>

      <div className="login-divider">または</div>

      <form onSubmit={(e) => void handleEmail(e)} className="login-email-form">
        <label htmlFor="email">メールアドレス</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? '送信中…' : 'ログインリンクを送る'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <section className="login-benefits">
        <h2>ログインのインセンティブゥ～💨</h2>
        <ul>
          <li>自分のログ一覧を、どの端末からでも見られる</li>
          <li>投稿したログを自分で編集・削除できる</li>
          <li><strong>メタンポイント</strong>が溜まる（投稿・写真・新しい都道府県など）</li>
          <li><strong>称号</strong>と<strong>特別モヤ</strong>が解放される</li>
          <li>ランキングに名前が載る</li>
        </ul>
        <p className="hint">
          ログインしなくても投稿はできます。その場合は、この端末に保存されたログだけ管理できます。
        </p>
      </section>

      <Link to="/my-logs" className="back-link">← マイ屁ログへ戻る</Link>
    </div>
  )
}
