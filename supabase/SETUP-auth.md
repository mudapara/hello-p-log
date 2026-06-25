# 認証まわりの Supabase / Google 設定

## 1. ログインメールを日本語化

Supabase Dashboard → **Authentication** → **Emails**

### Magic Link（メールログイン）

| 項目 | 内容 |
|------|------|
| Subject | `email-templates/magic-link.subject.txt` をコピー |
| Body (HTML) | `email-templates/magic-link.html` をコピー |

### Confirm signup（初回登録時）

| 項目 | 内容 |
|------|------|
| Subject | `email-templates/confirm-signup.subject.txt` をコピー |
| Body (HTML) | `email-templates/confirm-signup.html` をコピー |

**Sender name**（表示名）があれば `Hello屁ログ` に変更。

`{{ .ConfirmationURL }}` は**そのまま残す**（リンク用の変数です）。

### Resend 利用時の注意（テスト段階）

送信元が `onboarding@resend.dev` のとき、**Resend に登録したメールアドレス宛にしか送れない**ことがあります。  
別のアドレス（例: 友人の Gmail）には届きません。

誰にでも送るには Resend でドメインを認証し、Sender email を `noreply@あなたのドメイン` に変更してください。

---

## 2. リダイレクト URL

**Authentication** → **URL Configuration**

| 項目 | 値 |
|------|-----|
| Site URL | `https://hello-p-log.vercel.app` |
| Redirect URLs | `https://hello-p-log.vercel.app/**` |
| | `http://localhost:5173/**`（ローカル開発用） |

---

## 3. Google ログインの公開範囲

### テスト中（自分や友人だけ）

**Google Cloud Console** → OAuth 同意画面 → **対象** → **テストユーザー**

- ログインさせたい Gmail を1件ずつ追加
- テストユーザー以外はログインできない

### 一般公開（誰でもログイン可）

1. OAuth 同意画面で **アプリを公開**（Publish app）
2. スコープは `email`, `profile`, `openid` だけなら通常は審査なしで通ることが多い
3. 公開後はテストユーザー登録なしでログイン可能

**おすすめ:** 公開前はテストユーザーのみ。問題なければ公開。

---

## 4. データベース（初回のみ）

SQL Editor で順に実行（2回目以降は `migration_fix_grants.sql` だけで OK）:

1. `schema.sql`
2. `migration_profiles.sql`（またはテーブル作成済みなら `migration_fix_grants.sql` のみ）
