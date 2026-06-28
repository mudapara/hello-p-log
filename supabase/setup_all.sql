-- Hello屁ログ — Supabase 初回セットアップ（SQL Editor でこのファイルをまとめて実行）
-- Table Editor にテーブルが無いときに使う

-- ========== 1. ログ・お問い合わせ ==========
create table if not exists fart_logs (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete set null,
  source text not null check (source in ('ai', 'user')),
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now(),
  logged_at timestamptz not null,
  nickname text not null,
  gender text,
  age_display text,
  hide_gender boolean not null default false,
  hide_age boolean not null default false,
  main_component text not null,
  smell_type text not null,
  smell_type_other text,
  smell_intensity int not null,
  smell_intensity_other text,
  sound_text text not null,
  sound_preset text not null,
  sound_other text,
  busted_count int not null default 0,
  busted_other text,
  tactics jsonb not null default '[]',
  tactics_other text,
  release_speed_kmh int,
  release_speed_comparison text,
  dilution_rate text,
  social_impact text,
  entity_type text not null check (entity_type in ('human', 'animal')),
  animal_species text,
  observed_confirmed boolean not null default false,
  photo_data_url text,
  photo_tap_x double precision,
  photo_tap_y double precision,
  blur_confirmed boolean not null default false,
  fart_location text,
  fart_location_other text
);

create index if not exists fart_logs_created_at_idx on fart_logs (created_at desc);
create index if not exists fart_logs_location_idx on fart_logs (latitude, longitude);
create index if not exists fart_logs_user_id_idx on fart_logs (user_id);

create table if not exists contact_submissions (
  id uuid primary key,
  type text not null check (type in ('report', 'delete', 'other')),
  log_id uuid references fart_logs (id) on delete set null,
  message text not null,
  reply_email text,
  created_at timestamptz not null default now()
);

-- ========== 2. ユーザープロフィール ==========
create table if not exists user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  methane_points int not null default 0,
  total_logs int not null default 0,
  photo_logs int not null default 0,
  silent_logs int not null default 0,
  max_methane_level double precision not null default 0,
  unique_prefectures jsonb not null default '[]',
  unlocked_titles jsonb not null default '[]',
  active_title text,
  active_mist_style text not null default 'default',
  last_login_date date,
  updated_at timestamptz not null default now()
);

create index if not exists user_profiles_points_idx on user_profiles (methane_points desc);

-- ========== 3. RLS ==========
alter table fart_logs enable row level security;
alter table contact_submissions enable row level security;
alter table user_profiles enable row level security;

drop policy if exists "Anyone can read fart_logs" on fart_logs;
create policy "Anyone can read fart_logs"
  on fart_logs for select using (true);

drop policy if exists "Anyone can insert fart_logs" on fart_logs;
create policy "Anyone can insert fart_logs"
  on fart_logs for insert with check (true);

drop policy if exists "Users update own logs" on fart_logs;
create policy "Users update own logs"
  on fart_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own logs" on fart_logs;
create policy "Users delete own logs"
  on fart_logs for delete
  using (auth.uid() = user_id);

drop policy if exists "Anyone can insert contact_submissions" on contact_submissions;
create policy "Anyone can insert contact_submissions"
  on contact_submissions for insert with check (true);

drop policy if exists "Anyone can read user_profiles" on user_profiles;
create policy "Anyone can read user_profiles"
  on user_profiles for select using (true);

drop policy if exists "Users upsert own profile" on user_profiles;
create policy "Users upsert own profile"
  on user_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own profile" on user_profiles;
create policy "Users update own profile"
  on user_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ========== 4. GRANT ==========
grant select, insert, update, delete on public.fart_logs to anon, authenticated;
grant select, insert on public.contact_submissions to anon, authenticated;
grant select, insert, update on public.user_profiles to anon, authenticated;
