-- 地図表示用の都道府県・市町村、位置取得方法
alter table fart_logs
  add column if not exists location_source text,
  add column if not exists map_prefecture text,
  add column if not exists map_city text;
