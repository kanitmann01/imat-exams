-- IMAT Exam Platform: optional cloud sync schema (free-tier Supabase).
-- Run once in the Supabase SQL editor. See SETUP-CLOUD.md.

create table if not exists public.attempts (
  attempt_id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exam_id text not null,
  schema_v int not null default 1,
  data jsonb not null,
  deleted boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.attempts enable row level security;

drop policy if exists "owner_full_access" on public.attempts;
create policy "owner_full_access" on public.attempts
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists attempts_user_updated_idx
  on public.attempts (user_id, updated_at);
