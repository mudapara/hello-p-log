/**
 * 本番TOPページ（またはプレビュー）を 1200x630 でキャプチャして public/ogp.png を生成する。
 * 使い方: npm run og:generate
 * 環境変数 OG_URL で URL を変更可能（例: http://localhost:4173/）
 */
import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.join(__dirname, '../public/ogp.png')
const url = process.env.OG_URL ?? 'https://www.hello-p-log.com/'

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2,
})

await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 })
await page.waitForTimeout(800)
await page.screenshot({ path: outPath, type: 'png' })
await browser.close()

console.log(`OGP image saved: ${outPath} (from ${url})`)
