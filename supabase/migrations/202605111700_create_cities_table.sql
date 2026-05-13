create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  state text,
  is_active boolean default false,
  provider_count integer default 0,
  latitude numeric,
  longitude numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists cities_is_active_idx on public.cities (is_active);
create index if not exists cities_provider_count_idx on public.cities (provider_count);

drop trigger if exists cities_set_updated_at on public.cities;
create trigger cities_set_updated_at
before update on public.cities
for each row
execute function public.set_updated_at();

alter table public.cities enable row level security;

drop policy if exists "Service role can manage cities" on public.cities;
create policy "Service role can manage cities"
on public.cities
for all
to service_role
using (true)
with check (true);

drop policy if exists "Public users can read active cities" on public.cities;
create policy "Public users can read active cities"
on public.cities
for select
to anon, authenticated
using (is_active = true);
