-- User profiles for メタンポイント, titles, and mist styles
-- Run in Supabase SQL Editor

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

alter table user_profiles enable row level security;

create policy "Anyone can read user_profiles"
  on user_profiles for select using (true);

create policy "Users upsert own profile"
  on user_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users update own profile"
  on user_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- API（anon / authenticated）から読み書きできるようにする
grant select, insert, update on public.user_profiles to anon, authenticated;
