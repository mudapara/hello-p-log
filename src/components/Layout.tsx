import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { APP_NAME, TAGLINE, ABOUT_USAGE_URL, FEATURE_PHOTO, FEATURE_AR, FEATURE_MAP, FEATURE_LOG_POST } from '../lib/constants'
import './Layout.css'

const NAV = [
  { to: '/', label: 'TOP' },
  { to: '/photo', label: FEATURE_PHOTO.nav },
  { to: '/ar', label: FEATURE_AR.nav },
  { to: '/map', label: FEATURE_MAP.nav },
  { to: '/log/new', label: FEATURE_LOG_POST.nav },
  { to: '/my-logs', label: 'マイ屁ログ' },
  { to: '/ranking', label: 'ランキング' },
  { to: '/about', label: 'このサイトについて' },
]

function isNavActive(pathname: string, to: string): boolean {
  if (to === '/my-logs') {
    return pathname === '/my-logs' || pathname.startsWith('/log/edit/')
  }
  if (to === '/log/new') {
    return pathname === '/log/new'
  }
  if (to === '/ar') {
    return pathname === '/ar'
  }
  return pathname === to
}

export function Layout() {
  const { pathname } = useLocation()
  const { user, authAvailable, signOut } = useAuth()

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
              className={isNavActive(pathname, item.to) ? 'nav-link active' : 'nav-link'}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {authAvailable && (
          <div className="auth-bar">
            {user ? (
              <>
                <span className="auth-email">{user.email}</span>
                <button type="button" className="auth-btn" onClick={() => void signOut()}>
                  ログアウト
                </button>
              </>
            ) : (
              <Link to="/login" className="auth-btn auth-btn--link">ログイン</Link>
            )}
          </div>
        )}
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <Link to={ABOUT_USAGE_URL}>使い方・注意事項</Link>
        <span>·</span>
        <Link to="/contact">お問い合わせ</Link>
      </footer>
    </div>
  )
}
