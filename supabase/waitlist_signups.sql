create extension if not exists pgcrypto;

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null unique
);

alter table public.waitlist_signups enable row level security;

drop policy if exists "Allow public insert waitlist signups" on public.waitlist_signups;
create policy "Allow public insert waitlist signups"
on public.waitlist_signups
for insert
to anon
with check (true);

