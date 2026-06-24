import { Link } from 'react-router-dom'
import { APP_NAME } from '../lib/constants'
import './TopPage.css'

const ENTRIES = [
  { to: '/photo', title: '写真鑑識', desc: '写真に黄色いログが浮かぶ。タップでメタン情報。' },
  { to: '/map', title: '日本マップ', desc: '全国のおなら痕跡。増えるほど黄色くなる。' },
  { to: '/log/new', title: 'ログ投稿', desc: '地図に痕跡を残す。写真は任意。' },
] as const

export function TopPage() {
  return (
    <div className="top-page">
      <section className="top-hero">
        <p className="top-kicker">世界を黄色にする、覚悟のサイト</p>
        <h1 className="top-title">{APP_NAME}</h1>
        <p className="top-manifesto">
          おならをした場所に、黄色いログを残す——そんなサイトです。
        </p>
        <p className="top-sub">
          真面目に作った。でも、ばかばかしい。それがいい。
        </p>
      </section>

      <nav className="top-nav" aria-label="メイン機能">
        {ENTRIES.map((item) => (
          <Link key={item.to} to={item.to} className="top-card">
            <span className="top-card-title">{item.title}</span>
            <span className="top-card-desc">{item.desc}</span>
            <span className="top-card-go">いくぞ →</span>
          </Link>
        ))}
      </nav>

      <p className="top-footnote">
        音は鳴りません。でも、想像はしてください。
      </p>
    </div>
  )
}
