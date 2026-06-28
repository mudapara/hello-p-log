-- ログ投稿フォームの「その他（自由記述）」用カラム
alter table fart_logs
  add column if not exists smell_type_other text,
  add column if not exists smell_intensity_other text,
  add column if not exists sound_other text,
  add column if not exists busted_other text,
  add column if not exists tactics_other text;