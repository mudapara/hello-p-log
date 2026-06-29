import { Analytics } from '@vercel/analytics/react'

/** Vercel Web Analytics — 本番のみ計測（ダッシュボードで閲覧） */
export function SiteAnalytics() {
  if (!import.meta.env.PROD) return null
  return <Analytics />
}
