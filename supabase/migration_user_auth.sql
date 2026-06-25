-- Run in Supabase SQL Editor after initial schema.sql
-- Enables user-owned logs with edit/delete via Supabase Auth

alter table fart_logs
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists fart_logs_user_id_idx on fart_logs (user_id);

-- Users can update/delete only their own user logs
create policy "Users update own logs"
  on fart_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own logs"
  on fart_logs for delete
  using (auth.uid() = user_id);

-- Optional: require auth for new user logs (anonymous posts still allowed if user_id is null)
-- create policy "Users insert own logs"
--   on fart_logs for insert
--   with check (source = 'ai' or auth.uid() = user_id or user_id is null);
