import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { deleteOwnLog, fetchMyLogs } from '../lib/logStore'
import {
  getUserProfile,
  recordDailyLogin,
  updateUserProfileSettings,
} from '../lib/profileStore'
import { FEATURE_LOG_POST } from '../lib/constants'
import { formatDateTime } from '../lib/geo'
import { getTitleById, MIST_STYLES, computeUnlockedMistStyles, type MistStyleId } from '../lib/titles'
import type { FartLog, UserProfile } from '../types'
import './MyLogsPage.css'

const LOGIN_BENEFITS = [
  '自分のログ一覧を、どの端末からでも見られる',
  '投稿したログを自分で編集・削除できる',
  'メタンポイントが溜まる（投稿・写真・新しい都道府県など）',
  '称号と特別モヤが解放される',
  'ランキングに名前が載る',
] as const

export function MyLogsPage() {
  const { user, loading: authLoading, authAvailable } = useAuth()
  const [logs, setLogs] = useState<FartLog[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null)

  const load = async () => {
    if (!user?.id) {
      setLogs([])
      setProfile(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setSettingsMsg(null)
    const data = await fetchMyLogs(user.id)
    setLogs(data)
    await recordDailyLogin(user.id).catch(() => undefined)
    setProfile(await getUserProfile(user.id))
    setLoading(false)
  }

  useEffect(() => {
    if (authLoading) return
    void load()
  }, [authLoading, user?.id])

  const handleDelete = async (id: string) => {
    if (!user?.id) return
    if (!confirm('このログを削除しますか？マップからも消えます。')) return
    try {
      await deleteOwnLog(id, user.id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '削除に失敗しました')
    }
  }

  const handleTitleChange = async (titleId: string) => {
    if (!user?.id) return
    try {
      const updated = await updateUserProfileSettings(user.id, {
        activeTitle: titleId || null,
      })
      setProfile(updated)
      setSettingsMsg('称号を変更しました')
    } catch (e) {
      setError(e instanceof Error ? e.message : '設定の保存に失敗しました')
    }
  }

  const handleMistChange = async (style: MistStyleId) => {
    if (!user?.id) return
    try {
      const updated = await updateUserProfileSettings(user.id, {
        activeMistStyle: style,
      })
      setProfile(updated)
      setSettingsMsg('特別モヤを変更しました')
    } catch (e) {
      setError(e instanceof Error ? e.message : '設定の保存に失敗しました')
    }
  }

  const unlockedMist = profile
    ? computeUnlockedMistStyles(profile.unlockedTitles)
    : (['default'] as MistStyleId[])

  if (authAvailable && !user) {
    return (
      <div className="my-logs-page">
        <h1>マイ屁ログ</h1>
        <p className="lead">ログインすると、ポイント・称号・自分のログ管理が使えます。</p>

        <div className="my-logs-notice my-logs-login-gate">
          <h2>Googleでログインすると…</h2>
          <ul className="login-benefits-list">
            {LOGIN_BENEFITS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="hint">
            ログインなしでもマップへの投稿はできます。編集・削除やポイント・ランキングはログインが必要です。
          </p>
          <Link to="/login" className="btn btn-primary">Googleでログイン</Link>
        </div>

        <p className="my-logs-post-link">
          まずは投稿だけ試す → <Link to="/log/new">{FEATURE_LOG_POST.nav}</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="my-logs-page">
      <h1>マイ屁ログ</h1>
      <p className="lead">自分のログ一覧・メタンポイント・称号・特別モヤ</p>

      {profile && (
        <section className="profile-card">
          <div className="profile-points">
            <span className="points-label">メタンポイント</span>
            <span className="points-value">{profile.methanePoints}</span>
            <span className="points-unit">pt</span>
          </div>
          <dl className="profile-stats">
            <div><dt>累計ログ</dt><dd>{profile.totalLogs}</dd></div>
            <div><dt>写真付き</dt><dd>{profile.photoLogs}</dd></div>
            <div><dt>最高メタン</dt><dd>{profile.maxMethaneLevel}</dd></div>
            <div><dt>都道府県</dt><dd>{profile.uniquePrefectures.length}</dd></div>
          </dl>

          <div className="profile-titles">
            <h2>称号</h2>
            {profile.unlockedTitles.length === 0 ? (
              <p className="hint">ログを投稿すると称号が解放されます</p>
            ) : (
              <div className="title-chips">
                {profile.unlockedTitles.map((id) => {
                  const title = getTitleById(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      className={profile.activeTitle === id ? 'title-chip active' : 'title-chip'}
                      onClick={() => void handleTitleChange(id)}
                    >
                      {title?.name ?? id}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="profile-mist">
            <h2>特別モヤ</h2>
            <div className="mist-options">
              {unlockedMist.map((style) => (
                <button
                  key={style}
                  type="button"
                  className={
                    profile.activeMistStyle === style ? 'mist-option active' : 'mist-option'
                  }
                  onClick={() => void handleMistChange(style)}
                >
                  {MIST_STYLES[style].name}
                </button>
              ))}
            </div>
            <p className="hint">マップと写真に、あなたのログだけ特別な見た目で表示されます</p>
          </div>
        </section>
      )}

      {authAvailable && user && (
        <p className="my-logs-user">
          ログイン中: <strong>{user.email}</strong>
        </p>
      )}

      <div className="my-logs-toolbar">
        <button type="button" className="btn" onClick={() => void load()} disabled={loading}>
          更新
        </button>
        <Link to="/ranking" className="btn">ランキングを見る</Link>
      </div>

      {settingsMsg && <p className="success">{settingsMsg}</p>}
      {error && <p className="error">{error}</p>}
      {loading && <p className="hint">読み込み中…</p>}

      {!loading && logs.length === 0 && (
        <div className="my-logs-empty">
          <p>まだ投稿したログがありません。</p>
          <Link to="/log/new" className="btn btn-primary">ログを投稿する</Link>
        </div>
      )}

      <ul className="my-logs-list">
        {logs.map((log) => (
          <li key={log.id}>
            <div className="my-logs-info">
              <strong>{log.nickname}</strong>
              <span className="my-logs-date">{formatDateTime(log.loggedAt)}</span>
              <p>{log.mainComponent}</p>
              {log.photoDataUrl && <span className="my-logs-badge">写真付き</span>}
            </div>
            <div className="my-logs-actions">
              <Link to={`/log/edit/${log.id}`} className="btn">編集</Link>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => void handleDelete(log.id)}
              >
                削除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
