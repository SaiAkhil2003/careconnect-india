create extension if not exists pgcrypto;

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text,
  provider_name text not null,
  slug text unique not null,
  service_types text[] not null,
  description text,
  areas_covered text[] not null,
  languages_spoken text[] not null,
  phone text not null,
  email text,
  website_url text,
  address_line text,
  city text default 'Visakhapatnam',
  pricing_range text,
  established_year integer,
  staff_count_range text,
  is_verified boolean default false,
  listing_tier text default 'free',
  is_active boolean default false,
  logo_url text,
  stripe_customer_id text,
  stripe_subscription_id text,
  lead_email text,
  lead_whatsapp text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint providers_service_types_not_empty check (cardinality(service_types) > 0),
  constraint providers_service_types_check check (
    service_types <@ array[
      'home_care',
      'senior_living',
      'day_care',
      'physio',
      'geriatric_doctor',
      'companion',
      'dementia_care'
    ]::text[]
  ),
  constraint providers_areas_covered_not_empty check (cardinality(areas_covered) > 0),
  constraint providers_languages_spoken_not_empty check (cardinality(languages_spoken) > 0),
  constraint providers_pricing_range_check check (
    pricing_range is null or pricing_range in ('budget', 'mid', 'premium')
  ),
  constraint providers_staff_count_range_check check (
    staff_count_range is null or staff_count_range in ('1-5', '6-20', '21-50', '50+')
  ),
  constraint providers_listing_tier_check check (
    listing_tier in ('free', 'standard', 'premium')
  )
);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.providers(id) on delete cascade,
  family_name text not null,
  family_phone text not null,
  family_email text,
  message text,
  service_needed text,
  is_delivered boolean default false,
  delivery_method text default 'email',
  created_at timestamptz default now(),
  constraint enquiries_delivery_method_check check (
    delivery_method in ('email', 'whatsapp', 'both')
  )
);

create table public.provider_analytics (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.providers(id) on delete cascade,
  date date not null,
  profile_views integer default 0,
  enquiry_count integer default 0,
  created_at timestamptz default now(),
  constraint provider_analytics_provider_date_unique unique (provider_id, date)
);

create index providers_is_active_idx on public.providers (is_active);
create index providers_listing_tier_idx on public.providers (listing_tier);
create index providers_service_types_idx on public.providers using gin (service_types);
create index providers_areas_covered_idx on public.providers using gin (areas_covered);
create index providers_languages_spoken_idx on public.providers using gin (languages_spoken);
create index enquiries_provider_id_idx on public.enquiries (provider_id);
create index provider_analytics_provider_id_idx on public.provider_analytics (provider_id);
create index provider_analytics_date_idx on public.provider_analytics (date);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger providers_set_updated_at
before update on public.providers
for each row
execute function public.set_updated_at();

create or replace function public.increment_provider_analytics(
  target_provider_id uuid,
  metric text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if metric not in ('profile_views', 'enquiry_count') then
    raise exception 'Unsupported analytics metric: %', metric;
  end if;

  insert into public.provider_analytics (
    provider_id,
    date,
    profile_views,
    enquiry_count
  )
  values (
    target_provider_id,
    current_date,
    case when metric = 'profile_views' then 1 else 0 end,
    case when metric = 'enquiry_count' then 1 else 0 end
  )
  on conflict (provider_id, date)
  do update set
    profile_views = public.provider_analytics.profile_views
      + case when metric = 'profile_views' then 1 else 0 end,
    enquiry_count = public.provider_analytics.enquiry_count
      + case when metric = 'enquiry_count' then 1 else 0 end;
end;
$$;

revoke all on function public.increment_provider_analytics(uuid, text) from public;
grant execute on function public.increment_provider_analytics(uuid, text) to service_role;

alter table public.providers enable row level security;
alter table public.enquiries enable row level security;
alter table public.provider_analytics enable row level security;

create policy "Service role can manage providers"
on public.providers
for all
to service_role
using (true)
with check (true);

create policy "Public users can read active providers"
on public.providers
for select
to anon, authenticated
using (is_active = true);

create policy "Providers can read their own profile"
on public.providers
for select
to authenticated
using (
  clerk_user_id is not null
  and clerk_user_id = coalesce(auth.jwt() ->> 'clerk_user_id', auth.jwt() ->> 'sub')
);

create policy "Providers can update their own profile"
on public.providers
for update
to authenticated
using (
  clerk_user_id is not null
  and clerk_user_id = coalesce(auth.jwt() ->> 'clerk_user_id', auth.jwt() ->> 'sub')
)
with check (
  clerk_user_id is not null
  and clerk_user_id = coalesce(auth.jwt() ->> 'clerk_user_id', auth.jwt() ->> 'sub')
);

create policy "Service role can manage enquiries"
on public.enquiries
for all
to service_role
using (true)
with check (true);

create policy "Public users can insert enquiries"
on public.enquiries
for insert
to anon, authenticated
with check (
  provider_id is not null
  and exists (
    select 1
    from public.providers
    where public.providers.id = public.enquiries.provider_id
      and public.providers.is_active = true
  )
);

create policy "Providers can read their own enquiries"
on public.enquiries
for select
to authenticated
using (
  exists (
    select 1
    from public.providers
    where public.providers.id = public.enquiries.provider_id
      and public.providers.clerk_user_id is not null
      and public.providers.clerk_user_id = coalesce(
        auth.jwt() ->> 'clerk_user_id',
        auth.jwt() ->> 'sub'
      )
  )
);

create policy "Service role can manage provider analytics"
on public.provider_analytics
for all
to service_role
using (true)
with check (true);

create policy "Providers can read their own analytics"
on public.provider_analytics
for select
to authenticated
using (
  exists (
    select 1
    from public.providers
    where public.providers.id = public.provider_analytics.provider_id
      and public.providers.clerk_user_id is not null
      and public.providers.clerk_user_id = coalesce(
        auth.jwt() ->> 'clerk_user_id',
        auth.jwt() ->> 'sub'
      )
  )
);
