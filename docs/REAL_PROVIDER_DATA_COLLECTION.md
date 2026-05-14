# Real Provider Data Collection

CareConnect India must publish only provider data that has been collected, verified, approved, and consented for publication.

## Rules

- Real provider records must be collected from the provider or another approved source and verified before publication.
- Do not use scraped provider data.
- Do not publish unverified real provider names, phone numbers, email addresses, addresses, or websites.
- Do not mark sample/demo providers as real providers.
- Keep sample/demo providers clearly labelled as sample or demo data.
- Keep `is_active = false` until a provider has passed verification and approval.
- Keep `is_verified = false` until the provider has passed the verification process.

## Import Template

Use `supabase/provider-import-template.csv` for city-by-city real provider onboarding. Each row should include the source, verifier, verification date, consent status, and notes so reviewers can audit why a listing is publishable.

Array-like fields such as `areas_covered`, `service_types`, and `languages_spoken` should use a consistent delimiter agreed by the importer before loading into Supabase.

## Pan India Demo Provider Data

A demo provider seed exists for almost every city/place in `public.cities`. Normal cities receive multiple demo provider types, and major cities receive demo providers across all supported service types. Demo providers are not real providers.

Demo data is only for UI testing, search testing, city activation demos, and stakeholder review. Real launch requires verified provider onboarding, provider consent, and admin approval. All-city activation is demo only. Production should activate cities only after real provider coverage exists.

Manual demo data steps:

- To load demo providers, run `supabase/seed-demo-providers-pan-india.sql`.
- To activate all demo cities, run `supabase/seed-demo-activate-pan-india-cities.sql`.
- To remove generated demo providers, run `supabase/cleanup-demo-providers-pan-india.sql`.

## Go-Live Gate

Sample/demo providers are not real providers and do not count toward launch coverage.

Go-live requires 50+ real approved providers across launch cities, with provider consent and founder/admin approval completed before the listings are made public.

Admin approval is handled through Supabase Studio for MVP v1. Keep provider rows inactive until the reviewer has documented the source, consent status, verifier, and approval notes.
