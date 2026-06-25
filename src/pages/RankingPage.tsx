import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPrefectureRanking, fetchUserRanking } from '../lib/profileStore'
import { getTitleById } from '../lib/titles'
import type { PrefectureRankingEntry, UserRankingEntry } from '../types'
import './RankingPage.css'

export function RankingPage() {
  const [prefectureRanking, setPrefectureRanking] = useState<PrefectureRankingEntry[]>([])
  const [userRanking, setUserRanking] = useState<UserRankingEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const [prefs, users] = await Promise.all([
        fetchPrefectureRanking(15),
        fetchUserRanking(15),
      ])
      setPrefectureRanking(prefs)
      setUserRanking(users)
      setLoading(false)
    })()
  }, [])

  return (
    <div className="ranking-page">
      <h1>ランキング</h1>
      <p className="lead">
        都道府県別のログ数と、ログインユーザーのメタンポイント順位です。
      </p>

      {loading && <p className="hint">集計中…</p>}

      <section className="ranking-section">
        <h2>エリアランキング</h2>
        <p className="section-desc">ユーザーログが多い都道府県トップ</p>
        {prefectureRanking.length === 0 && !loading && (
          <p className="hint">まだデータがありません</p>
        )}
        <ol className="ranking-list">
          {prefectureRanking.map((entry, index) => (
            <li key={entry.prefecture}>
              <span className="rank">{index + 1}</span>
              <span className="name">{entry.prefecture}</span>
              <span className="score">{entry.count} 件</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="ranking-section">
        <h2>メタンポイントランキング</h2>
        <p className="section-desc">ログインユーザーの累計ポイント順（ログインで参加）</p>
        {userRanking.length === 0 && !loading && (
          <p className="hint">
            まだ参加者がいません。
            <Link to="/login">ログイン</Link>
            してログを投稿すると載ります。
          </p>
        )}
        <ol className="ranking-list ranking-list-users">
          {userRanking.map((entry, index) => (
            <li key={entry.userId}>
              <span className="rank">{index + 1}</span>
              <div className="user-block">
                <span className="name">{entry.displayName}</span>
                {entry.activeTitle && (
                  <span className="title-badge">
                    {getTitleById(entry.activeTitle)?.name ?? entry.activeTitle}
                  </span>
                )}
              </div>
              <span className="score">{entry.methanePoints} pt</span>
            </li>
          ))}
        </ol>
      </section>

      <p className="ranking-note">
        メタンポイントはログ投稿・写真付き・高メタン・新しい都道府県などで溜まります。
        <Link to="/my-logs">マイ屁ログ</Link>
        で称号と特別モヤを確認できます。
      </p>
    </div>
  )
}
