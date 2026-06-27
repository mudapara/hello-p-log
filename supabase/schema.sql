-- Hello屁ログ Supabase schema
-- Run in Supabase SQL Editor

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
  smell_intensity int not null,
  sound_text text not null,
  sound_preset text not null,
  busted_count int not null default 0,
  tactics jsonb not null default '[]',
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

alter table fart_logs enable row level security;
alter table contact_submissions enable row level security;

create policy "Anyone can read fart_logs"
  on fart_logs for select using (true);

create policy "Anyone can insert fart_logs"
  on fart_logs for insert with check (true);

create policy "Anyone can insert contact_submissions"
  on contact_submissions for insert with check (true);

create policy "Users update own logs"
  on fart_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own logs"
  on fart_logs for delete
  using (auth.uid() = user_id);

-- Admin delete: use Supabase dashboard or service role
