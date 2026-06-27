import { Link } from 'react-router-dom'
import { APP_NAME, FEATURE_PHOTO, FEATURE_AR, FEATURE_MAP, FEATURE_LOG_POST } from '../lib/constants'
import './TopPage.css'

const ENTRIES = [
  { to: '/photo', title: FEATURE_PHOTO.title, desc: FEATURE_PHOTO.desc },
  { to: '/ar', title: FEATURE_AR.title, desc: FEATURE_AR.desc },
  { to: '/map', title: FEATURE_MAP.title, desc: FEATURE_MAP.desc },
  { to: '/log/new', title: FEATURE_LOG_POST.title, desc: FEATURE_LOG_POST.desc },
  { to: '/ranking', title: 'ランキング', desc: '都道府県別・メタンポイント順位。' },
  { to: '/my-logs', title: 'マイ屁ログ', desc: '自分のログ・メタンポイント・称号・特別モヤ。' },
] as const

export function TopPage() {
  return (
    <div className="top-page">
      <section className="top-hero">
        <p className="top-kicker">今日もどこかで、誰かが残した</p>
        <h1 className="top-title">{APP_NAME}</h1>
        <p className="top-manifesto">
          おならをした場所に、黄色いログを残す——そんなサイトです。
        </p>
        <p className="top-sub">
          誰も求めていない。しかし放たれたのだ…
        </p>
      </section>

      <nav className="top-nav" aria-label="メイン機能">
        {ENTRIES.map((item) => (
          <Link key={item.to} to={item.to} className="top-card">
            <span className="top-card-title">{item.title}</span>
            <span className="top-card-desc">{item.desc}</span>
            <span className="top-card-go">こいてみる →</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
