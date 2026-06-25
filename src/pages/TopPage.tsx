import { Link } from 'react-router-dom'
import { APP_NAME } from '../lib/constants'
import './TopPage.css'

const ENTRIES = [
  { to: '/photo', title: '写真鑑識', desc: '写真に黄色いログが浮かぶ。タップでメタン情報。' },
  { to: '/ar', title: '現場AR', desc: 'カメラ越しにモヤを出す。写真鑑識のAR版。' },
  { to: '/map', title: '日本マップ', desc: '全国のおなら痕跡。増えるほど黄色くなる。' },
  { to: '/log/new', title: 'ログ投稿', desc: '地図に痕跡を残す。写真は任意。' },
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
