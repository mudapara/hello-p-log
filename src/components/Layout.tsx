import { Link, Outlet, useLocation } from 'react-router-dom'
import { APP_NAME, TAGLINE } from '../lib/constants'
import './Layout.css'

const NAV = [
  { to: '/', label: 'TOP' },
  { to: '/photo', label: '写真鑑識' },
  { to: '/map', label: '日本マップ' },
  { to: '/log/new', label: 'ログ投稿' },
  { to: '/about', label: '使い方・注意' },
]

export function Layout() {
  const { pathname } = useLocation()

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="brand">
          <span className="brand-name">{APP_NAME}</span>
          <span className="brand-tag">{TAGLINE}</span>
        </Link>
        <nav className="nav">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={pathname === item.to ? 'nav-link active' : 'nav-link'}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <Link to="/about">使い方・注意事項</Link>
        <span>·</span>
        <Link to="/contact">お問い合わせ</Link>
      </footer>
    </div>
  )
}
