-- Run once in Supabase SQL Editor if My Logs still fails to load profiles
-- Safe to re-run (skips objects that already exist)

alter table fart_logs
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists fart_logs_user_id_idx on fart_logs (user_id);

grant select, insert, update on public.user_profiles to anon, authenticated;
grant select, insert, update, delete on public.fart_logs to anon, authenticated;
