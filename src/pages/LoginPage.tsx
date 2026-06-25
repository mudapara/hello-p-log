import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getErrorMessage } from '../lib/errors'
import './LoginPage.css'

function formatAuthError(error: unknown): string {
  const message = getErrorMessage(error, 'ログインに失敗しました')
  if (message.includes('provider is not enabled')) {
    return 'Googleログインは現在利用できません。しばらくしてからもう一度お試しください。'
  }
  return message
}

export function LoginPage() {
  const { user, authAvailable, signInWithGoogle } = useAuth()
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
      setError(formatAuthError(e))
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <h1>ログイン</h1>
      <p className="lead">Googleアカウントでログインできます。</p>

      <button
        type="button"
        className="btn btn-google"
        disabled={loading}
        onClick={() => void handleGoogle()}
      >
        {loading ? 'Googleに移動中…' : 'Googleでログイン'}
      </button>

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
