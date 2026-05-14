-- WARNING:
-- This activates cities for demo and stakeholder testing only.
-- Do not run this for real production launch unless real provider coverage is verified.
-- Demo providers are not real providers.

update public.cities
set is_active = true,
    provider_count = demo_counts.count,
    updated_at = now()
from (
  select city, count(*) as count
  from public.providers
  where slug like 'demo-%'
    and is_active = true
  group by city
) demo_counts
where lower(public.cities.name) = lower(demo_counts.city);
