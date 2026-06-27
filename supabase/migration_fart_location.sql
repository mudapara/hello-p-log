-- 放屁場所フィールドを fart_logs に追加
alter table fart_logs
  add column if not exists fart_location text,
  add column if not exists fart_location_other text;
