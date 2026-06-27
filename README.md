# Hello屁ログ

おならログで世界を黄色にするサイト。

## 機能

- **写真アナライズ** — 写真を選ぶと黄色いログが浮かび、タップでメタン情報
- **ARログ検出** — カメラ映像の上に黄色いモヤを表示
- **ログ投稿** — ログのみ、または写真付きで投稿（合成画像DL可）
- **全国マップ** — ログ1件＝光る点1つ。AI（黄）と現地（金）を区別
- **使い方・注意事項** / **お問い合わせ** / **管理画面**（`/admin`）

## セットアップ

```bash
cd Projects/hello-p-log
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開く。

### ローカルモード（デフォルト）

Supabase 未設定時は **localStorage** に保存。このブラウザだけで動作確認できます。

### Supabase（本番・共有）

1. [Supabase](https://supabase.com) でプロジェクト作成
2. `supabase/schema.sql` を SQL Editor で実行
3. `.env` を作成:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_ADMIN_PASSWORD=your-secure-password
```

4. `npm run dev` を再起動

### ビルド

```bash
npm run build
npm run preview
```

Vercel / Cloudflare Pages などに `dist` をデプロイ。

## ページ一覧

| パス | 内容 |
|------|------|
| `/` | TOP |
| `/photo` | 写真アナライズ |
| `/ar` | ARログ検出 |
| `/map` | 全国マップ |
| `/log/new` | ログ投稿 |
| `/about` | 使い方・注意事項 |
| `/contact` | お問い合わせ（通報・削除依頼） |
| `/admin` | ログ削除（パスワード保護） |

## 技術スタック

- Vite + React + TypeScript
- Leaflet / react-leaflet
- Supabase（任意）
- Web Audio API（効果音プリセット）
