# 認証まわりの Supabase / Google 設定

Hello屁ログ は **Google ログインのみ** を使います（メールログインは使いません）。

## Google ログイン

Supabase Dashboard → **Authentication** → **Sign In / Providers** → **Google** を ON

Google Cloud Console で OAuth クライアント ID / Secret を設定し、リダイレクト URI に Supabase の callback URL を登録してください。

## リダイレクト URL

**Authentication** → **URL Configuration**

| 項目 | 値 |
|------|-----|
| Site URL | `https://hello-p-log.vercel.app` |
| Redirect URLs | `https://hello-p-log.vercel.app/**` |
| | `http://localhost:5173/**`（ローカル開発用） |

## Google ログインの公開範囲

### テスト中（自分や友人だけ）

Google Cloud → OAuth 同意画面 → **テストユーザー** に Gmail を追加

### 一般公開（誰でもログイン可）

OAuth 同意画面で **アプリを公開**

## データベース（初回のみ）

SQL Editor で順に実行（2回目以降は `migration_fix_grants.sql` だけで OK）:

1. `schema.sql`
2. `migration_profiles.sql`（またはテーブル作成済みなら `migration_fix_grants.sql` のみ）

---

## メールテンプレート / SMTP（参考・未使用）

`email-templates/` はメールログイン用に用意したファイルです。Google のみ運用する場合は設定不要です。
