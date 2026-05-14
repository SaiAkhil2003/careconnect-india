-- Pan-India demo provider seed for UI, search, and stakeholder testing.
--
-- WARNING:
-- This file creates clearly labelled demo providers only.
-- Demo providers are not real verified providers.
-- Do not use this as evidence of real provider coverage.
-- This seed owns only deterministic provider slugs beginning with demo-.
--
-- Source city/place directory:
-- select name, slug, state
-- from public.cities;

with major_cities(city_name, state_name) as (
  values
    ('Visakhapatnam', 'Andhra Pradesh'),
    ('Bengaluru', 'Karnataka'),
    ('Hyderabad', 'Telangana'),
    ('Chennai', 'Tamil Nadu'),
    ('Mumbai', 'Maharashtra'),
    ('Delhi', 'Delhi'),
    ('Pune', 'Maharashtra'),
    ('Kolkata', 'West Bengal'),
    ('Ahmedabad', 'Gujarat'),
    ('Kochi', 'Kerala'),
    ('Jaipur', 'Rajasthan'),
    ('Lucknow', 'Uttar Pradesh'),
    ('Indore', 'Madhya Pradesh'),
    ('Bhubaneswar', 'Odisha'),
    ('Guwahati', 'Assam'),
    ('Coimbatore', 'Tamil Nadu'),
    ('Mysuru', 'Karnataka'),
    ('Vijayawada', 'Andhra Pradesh'),
    ('Guntur', 'Andhra Pradesh'),
    ('Tirupati', 'Andhra Pradesh'),
    ('Nellore', 'Andhra Pradesh'),
    ('Kurnool', 'Andhra Pradesh'),
    -- Rajahmundry is represented by its official seed name.
    ('Rajamahendravaram', 'Andhra Pradesh'),
    ('Kakinada', 'Andhra Pradesh'),
    ('Warangal', 'Telangana'),
    ('Secunderabad', 'Telangana'),
    ('Noida', 'Uttar Pradesh'),
    ('Gurugram', 'Haryana'),
    ('Faridabad', 'Haryana'),
    ('Ghaziabad', 'Uttar Pradesh'),
    ('Thane', 'Maharashtra'),
    ('Navi Mumbai', 'Maharashtra'),
    ('Nagpur', 'Maharashtra'),
    ('Nashik', 'Maharashtra'),
    ('Surat', 'Gujarat'),
    ('Vadodara', 'Gujarat'),
    ('Patna', 'Bihar'),
    ('Chandigarh', 'Chandigarh'),
    ('Amritsar', 'Punjab'),
    ('Ludhiana', 'Punjab'),
    ('Bhopal', 'Madhya Pradesh'),
    ('Jabalpur', 'Madhya Pradesh'),
    ('Madurai', 'Tamil Nadu'),
    ('Thiruvananthapuram', 'Kerala'),
    ('Kozhikode', 'Kerala'),
    ('Mangaluru', 'Karnataka'),
    ('Hubballi', 'Karnataka'),
    ('Belagavi', 'Karnataka')
),
known_city_areas(city_name, areas) as (
  values
    (
      'Visakhapatnam',
      array[
        'MVP Colony',
        'Dwaraka Nagar',
        'Seethammadhara',
        'Gajuwaka',
        'Madhurawada',
        'Rushikonda',
        'Siripuram',
        'NAD',
        'Pendurthi',
        'Anakapalle',
        'Akkayyapalem',
        'Bheemili'
      ]::text[]
    ),
    (
      'Hyderabad',
      array[
        'Banjara Hills',
        'Jubilee Hills',
        'Madhapur',
        'Gachibowli',
        'Kukatpally',
        'Ameerpet',
        'Uppal',
        'Begumpet',
        'Secunderabad'
      ]::text[]
    ),
    (
      'Bengaluru',
      array[
        'Indiranagar',
        'Whitefield',
        'Jayanagar',
        'Koramangala',
        'Hebbal',
        'Electronic City',
        'Marathahalli'
      ]::text[]
    ),
    (
      'Chennai',
      array[
        'T Nagar',
        'Anna Nagar',
        'Adyar',
        'Velachery',
        'Tambaram',
        'Porur',
        'Mylapore'
      ]::text[]
    ),
    (
      'Mumbai',
      array[
        'Andheri',
        'Bandra',
        'Dadar',
        'Powai',
        'Thane',
        'Borivali',
        'Navi Mumbai'
      ]::text[]
    ),
    (
      'Pune',
      array[
        'Kothrud',
        'Hinjewadi',
        'Wakad',
        'Baner',
        'Hadapsar',
        'Viman Nagar'
      ]::text[]
    ),
    (
      'Delhi',
      array[
        'South Delhi',
        'Dwarka',
        'Rohini',
        'Lajpat Nagar',
        'Karol Bagh',
        'Saket'
      ]::text[]
    ),
    ('Kolkata', array['Salt Lake', 'New Town', 'Park Street', 'Ballygunge', 'Howrah']::text[]),
    ('Ahmedabad', array['Navrangpura', 'Satellite', 'Bopal', 'Maninagar']::text[]),
    ('Lucknow', array['Gomti Nagar', 'Hazratganj', 'Indira Nagar', 'Aliganj']::text[]),
    ('Bhubaneswar', array['Patia', 'Khandagiri', 'Saheed Nagar']::text[]),
    ('Kochi', array['Edappally', 'Kakkanad', 'Fort Kochi', 'Vyttila']::text[]),
    ('Jaipur', array['Malviya Nagar', 'Vaishali Nagar', 'C Scheme', 'Mansarovar']::text[]),
    ('Indore', array['Vijay Nagar', 'Palasia', 'Rau', 'Annapurna Road']::text[]),
    ('Guwahati', array['Dispur', 'Beltola', 'Paltan Bazaar', 'Six Mile']::text[]),
    ('Mangaluru', array['Kadri', 'Bejai', 'Kankanady', 'Hampankatta', 'Surathkal']::text[])
),
base_cities as (
  select
    c.name as city_name,
    c.slug as city_slug,
    c.state as state_name,
    row_number() over (
      order by coalesce(c.state, ''), c.name, c.slug
    ) as city_number,
    coalesce(
      k.areas,
      array[
        'Central ' || c.name,
        'North ' || c.name,
        'South ' || c.name
      ]::text[]
    ) as area_pool,
    case
      when c.state = 'Andhra Pradesh' then array['Telugu', 'English']::text[]
      when c.state = 'Telangana' then array['Telugu', 'Hindi', 'English']::text[]
      when c.state = 'Karnataka' then array['Kannada', 'English', 'Hindi']::text[]
      when c.state = 'Tamil Nadu' then array['Tamil', 'English']::text[]
      when c.state = 'Kerala' then array['Malayalam', 'English']::text[]
      when c.state = 'Maharashtra' then array['Marathi', 'Hindi', 'English']::text[]
      when c.state = 'Delhi' then array['Hindi', 'English']::text[]
      when c.name in ('Noida', 'Gurugram', 'Faridabad', 'Ghaziabad') then array['Hindi', 'English']::text[]
      when c.state = 'West Bengal' then array['Bengali', 'Hindi', 'English']::text[]
      when c.state = 'Gujarat' then array['Gujarati', 'Hindi', 'English']::text[]
      when c.state in ('Punjab', 'Chandigarh') then array['Punjabi', 'Hindi', 'English']::text[]
      when c.state = 'Odisha' then array['Odia', 'Hindi', 'English']::text[]
      when c.state = 'Assam' then array['Assamese', 'Hindi', 'English']::text[]
      else array['English', 'Hindi']::text[]
    end as languages_spoken,
    m.city_name is not null as is_major
  from public.cities c
  left join major_cities m
    on lower(c.name) = lower(m.city_name)
   and lower(coalesce(c.state, '')) = lower(coalesce(m.state_name, ''))
  left join known_city_areas k
    on lower(c.name) = lower(k.city_name)
  where c.name is not null
    and c.slug is not null
),
normal_provider_templates(
  template_key,
  slug_suffix,
  name_suffix,
  template_order,
  email_suffix,
  pricing_range,
  listing_tier,
  is_verified,
  staff_count_range
) as (
  values
    (
      'home_care',
      'home-care-sample',
      'Home Care Sample',
      1,
      'homecare',
      'budget',
      'free',
      false,
      '1-5'
    ),
    (
      'senior_support',
      'senior-support-sample',
      'Senior Support Sample',
      2,
      'seniorsupport',
      'mid',
      'standard',
      true,
      '6-20'
    ),
    (
      'health_support',
      'health-support-sample',
      'Health Support Sample',
      3,
      'healthsupport',
      'premium',
      'premium',
      true,
      '21-50'
    )
),
major_provider_templates(
  template_key,
  slug_suffix,
  name_suffix,
  template_order,
  service_types,
  email_suffix,
  pricing_range,
  listing_tier,
  is_verified,
  staff_count_range
) as (
  values
    (
      'home_care',
      'home-care-sample',
      'Home Care Sample',
      1,
      array['home_care']::text[],
      'homecare',
      'budget',
      'standard',
      true,
      '6-20'
    ),
    (
      'senior_living',
      'senior-living-sample',
      'Senior Living Sample',
      2,
      array['senior_living']::text[],
      'seniorliving',
      'premium',
      'premium',
      true,
      '21-50'
    ),
    (
      'day_care',
      'day-care-sample',
      'Day Care Sample',
      3,
      array['day_care']::text[],
      'daycare',
      'budget',
      'free',
      false,
      '1-5'
    ),
    (
      'physio',
      'physiotherapy-sample',
      'Physiotherapy Sample',
      4,
      array['physio']::text[],
      'physio',
      'mid',
      'standard',
      true,
      '6-20'
    ),
    (
      'geriatric_doctor',
      'geriatric-doctor-sample',
      'Geriatric Doctor Sample',
      5,
      array['geriatric_doctor']::text[],
      'geriatricdoctor',
      'premium',
      'premium',
      true,
      '21-50'
    ),
    (
      'companion',
      'companion-care-sample',
      'Companion Care Sample',
      6,
      array['companion']::text[],
      'companion',
      'mid',
      'free',
      false,
      '1-5'
    ),
    (
      'dementia_care',
      'dementia-care-sample',
      'Dementia Care Sample',
      7,
      array['dementia_care']::text[],
      'dementiacare',
      'premium',
      'standard',
      true,
      '21-50'
    )
),
normal_demo_rows as (
  select
    b.city_name,
    b.city_slug,
    b.state_name,
    b.city_number,
    t.template_order as provider_order,
    'Demo ' || b.city_name || ' ' || t.name_suffix as provider_name,
    'demo-' || b.city_slug || '-' || t.slug_suffix as slug,
    case
      when t.template_key = 'home_care' and b.city_number % 4 = 0 then array['home_care', 'day_care']::text[]
      when t.template_key = 'home_care' then array['home_care']::text[]
      when t.template_key = 'senior_support' and b.city_number % 4 in (1, 3) then array['senior_living', 'companion', 'dementia_care']::text[]
      when t.template_key = 'senior_support' then array['senior_living', 'companion']::text[]
      when t.template_key = 'health_support' and b.city_number % 4 = 2 then array['physio', 'geriatric_doctor', 'day_care']::text[]
      else array['physio', 'geriatric_doctor']::text[]
    end as service_types,
    case t.template_key
      when 'home_care' then array[b.area_pool[1], coalesce(b.area_pool[2], b.area_pool[1])]::text[]
      when 'senior_support' then array[coalesce(b.area_pool[3], b.area_pool[1]), b.area_pool[1]]::text[]
      else array[coalesce(b.area_pool[2], b.area_pool[1]), coalesce(b.area_pool[3], b.area_pool[1])]::text[]
    end as areas_covered,
    b.languages_spoken,
    t.email_suffix,
    t.pricing_range,
    t.listing_tier,
    t.is_verified,
    t.staff_count_range
  from base_cities b
  cross join normal_provider_templates t
  where not b.is_major
),
major_demo_rows as (
  select
    b.city_name,
    b.city_slug,
    b.state_name,
    b.city_number,
    t.template_order as provider_order,
    'Demo ' || b.city_name || ' ' || t.name_suffix as provider_name,
    'demo-' || b.city_slug || '-' || t.slug_suffix as slug,
    t.service_types,
    case t.template_key
      when 'home_care' then array[b.area_pool[1], coalesce(b.area_pool[2], b.area_pool[1])]::text[]
      when 'senior_living' then array[coalesce(b.area_pool[3], b.area_pool[1]), b.area_pool[1]]::text[]
      when 'day_care' then array[b.area_pool[1], coalesce(b.area_pool[3], b.area_pool[1])]::text[]
      when 'physio' then array[coalesce(b.area_pool[2], b.area_pool[1]), coalesce(b.area_pool[3], b.area_pool[1])]::text[]
      when 'geriatric_doctor' then array[
        b.area_pool[1],
        coalesce(b.area_pool[2], b.area_pool[1]),
        coalesce(b.area_pool[3], b.area_pool[1])
      ]::text[]
      when 'companion' then array[b.area_pool[1]]::text[]
      else array[coalesce(b.area_pool[2], b.area_pool[1]), b.area_pool[1]]::text[]
    end as areas_covered,
    b.languages_spoken,
    t.email_suffix,
    t.pricing_range,
    t.listing_tier,
    t.is_verified,
    t.staff_count_range
  from base_cities b
  cross join major_provider_templates t
  where b.is_major
),
demo_rows as (
  select * from normal_demo_rows
  union all
  select * from major_demo_rows
),
numbered_demo_rows as (
  select
    row_number() over (
      order by city_number, provider_order, slug
    ) as provider_number,
    demo_rows.*
  from demo_rows
)
insert into public.providers as target_provider (
  clerk_user_id,
  provider_name,
  slug,
  service_types,
  description,
  areas_covered,
  languages_spoken,
  phone,
  email,
  website_url,
  address_line,
  city,
  pricing_range,
  established_year,
  staff_count_range,
  is_verified,
  listing_tier,
  is_active,
  logo_url,
  stripe_customer_id,
  stripe_subscription_id,
  lead_email,
  lead_whatsapp
)
select
  null::text as clerk_user_id,
  provider_name,
  slug,
  service_types,
  'This is a demo listing created for testing CareConnect India city aware search. It is not a real verified provider.' as description,
  areas_covered,
  languages_spoken,
  '+91 90000 ' || lpad((10000 + provider_number)::text, 5, '0') as phone,
  'demo.' || replace(city_slug, '-', '.') || '.' || email_suffix || '@example.com' as email,
  null::text as website_url,
  'Demo address, ' || city_name || coalesce(', ' || nullif(state_name, ''), '') as address_line,
  city_name as city,
  pricing_range,
  (2015 + ((city_number + provider_order) % 10))::integer as established_year,
  staff_count_range,
  is_verified,
  listing_tier,
  true as is_active,
  null::text as logo_url,
  null::text as stripe_customer_id,
  null::text as stripe_subscription_id,
  'leads.demo.' || replace(city_slug, '-', '.') || '.' || email_suffix || '@example.com' as lead_email,
  '+91 90000 ' || lpad((30000 + provider_number)::text, 5, '0') as lead_whatsapp
from numbered_demo_rows
on conflict (slug) do update set
  clerk_user_id = excluded.clerk_user_id,
  provider_name = excluded.provider_name,
  service_types = excluded.service_types,
  description = excluded.description,
  areas_covered = excluded.areas_covered,
  languages_spoken = excluded.languages_spoken,
  phone = excluded.phone,
  email = excluded.email,
  website_url = excluded.website_url,
  address_line = excluded.address_line,
  city = excluded.city,
  pricing_range = excluded.pricing_range,
  established_year = excluded.established_year,
  staff_count_range = excluded.staff_count_range,
  is_verified = excluded.is_verified,
  listing_tier = excluded.listing_tier,
  is_active = excluded.is_active,
  logo_url = excluded.logo_url,
  stripe_customer_id = excluded.stripe_customer_id,
  stripe_subscription_id = excluded.stripe_subscription_id,
  lead_email = excluded.lead_email,
  lead_whatsapp = excluded.lead_whatsapp
where target_provider.slug like 'demo-%';
