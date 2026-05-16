-- Provider import staging notes for CareConnect India.
--
-- This file intentionally creates no tables and inserts no provider data.
-- Use these optional validation queries after manually staging or importing
-- candidate provider rows into public.providers.
--
-- Demo providers must remain clearly identifiable as demo/sample records.
-- Do not delete demo providers.
-- Do not delete Sai Test Elder Care.

-- 1. Find providers missing city.
select
  id,
  provider_name,
  city,
  is_active,
  is_verified
from public.providers
where city is null
  or length(trim(city)) = 0
order by provider_name;

-- 2. Find providers missing phone.
select
  id,
  provider_name,
  city,
  phone
from public.providers
where phone is null
  or length(trim(phone)) = 0
order by provider_name;

-- 3. Find providers missing service_types.
select
  id,
  provider_name,
  city,
  service_types
from public.providers
where service_types is null
  or cardinality(service_types) = 0
order by provider_name;

-- 4. Find active providers without lead_email.
select
  id,
  provider_name,
  city,
  listing_tier,
  email,
  lead_email
from public.providers
where is_active = true
  and (
    lead_email is null
    or length(trim(lead_email)) = 0
  )
order by listing_tier, provider_name;

-- 5. Find verified providers where is_active = false.
select
  id,
  provider_name,
  city,
  is_verified,
  is_active
from public.providers
where is_verified = true
  and coalesce(is_active, false) = false
order by provider_name;

-- 6. Find providers whose city is not in public.cities.
select
  p.id,
  p.provider_name,
  p.city
from public.providers p
where p.city is not null
  and length(trim(p.city)) > 0
  and not exists (
    select 1
    from public.cities c
    where lower(trim(c.name)) = lower(trim(p.city))
  )
order by p.city, p.provider_name;

-- 7. Count providers by city.
select
  coalesce(nullif(trim(city), ''), '(missing)') as city,
  count(*) as provider_count
from public.providers
group by coalesce(nullif(trim(city), ''), '(missing)')
order by provider_count desc, city;

-- 8. Count providers by listing_tier.
select
  coalesce(nullif(trim(listing_tier), ''), '(missing)') as listing_tier,
  count(*) as provider_count
from public.providers
group by coalesce(nullif(trim(listing_tier), ''), '(missing)')
order by provider_count desc, listing_tier;

-- 9. Count real providers excluding demo/sample records.
select
  count(*) as likely_real_provider_count
from public.providers
where coalesce(provider_name, '') !~* '\m(demo|sample)\M'
  and coalesce(description, '') !~* '\m(demo|sample)\M'
  and coalesce(email, '') not ilike '%@example.com'
  and coalesce(lead_email, '') not ilike '%@example.com';
