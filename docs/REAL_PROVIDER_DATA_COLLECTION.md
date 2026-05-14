# Real Provider Data Collection

CareConnect India must publish only provider data that has been collected, verified, approved, and consented for publication.

## Rules

- Real provider records must be collected from the provider or another approved source and verified before publication.
- Do not use scraped provider data.
- Do not use online directories as verified data.
- Do not publish unverified real provider names, phone numbers, email addresses, addresses, or websites.
- Do not mark sample/demo providers as real providers.
- Keep sample/demo providers clearly labelled as sample or demo data.
- Keep `is_active = false` until a provider has passed verification and approval.
- Keep `is_verified = false` until the provider has passed the verification process.
- Publish providers only after verification, consent, and admin approval.

## Source and Verification Workflow

Use `docs/REAL_PROVIDER_SOURCE_STRATEGY.md` as the primary sourcing playbook. It covers:

- Government and public welfare sources.
- ABDM Health Facility Registry.
- NABH healthcare organisation directory.
- Association and industry directories.
- Public business directories for lead discovery only.
- Provider official websites and social pages.
- Direct phone, email, WhatsApp, and consent verification.

Verification stages:

1. Discovered.
2. Source checked.
3. Contact verified.
4. Service verified.
5. Consent received.
6. Approved.
7. Published.
8. Rejected or inactive.

Only Approved and consent-received providers should be published publicly.

## Import Template

Use `supabase/provider-import-template.csv` for city-by-city real provider onboarding. Each row should include the source, source URL, source type, verifier, verification date, last contacted date, verification status, consent status, consent notes, and admin notes so reviewers can audit why a listing is publishable.

Array-like fields such as `areas_covered`, `service_types`, and `languages_spoken` should use a consistent delimiter agreed by the importer before loading into Supabase.

Some audit columns in the template are staging/review fields and may not exist in the current `public.providers` schema. Until the schema is extended, import only fields supported by the app and retain audit metadata in the research tracker or review archive.

## Research and Consent Templates

- Use `docs/provider-research-tracker-template.csv` for city-wise lead research.
- Use `docs/PROVIDER_VERIFICATION_CALL_SCRIPT.md` when calling providers.
- Use `docs/PROVIDER_LISTING_CONSENT_TEXT.md` to capture listing consent.
- Use `docs/REAL_PROVIDER_IMPORT_CHECKLIST.md` before import or publication.

## Recommended Launch City Priority

Phase 1:

- Visakhapatnam.
- Bengaluru.

Phase 2:

- Hyderabad.
- Chennai.
- Mumbai.
- Delhi.
- Pune.
- Kochi.

Phase 3:

- Kolkata.
- Ahmedabad.
- Jaipur.
- Lucknow.
- Indore.
- Guwahati.
- Coimbatore.
- Mysuru.
- Vijayawada.
- Guntur.
- Tirupati.

For each launch city, target:

- 10 home care providers.
- 5 senior living or assisted living providers.
- 5 physiotherapy or rehab providers.
- 5 geriatric doctor or clinic providers.
- 5 companion, day care, or dementia care providers.

These are collection targets, not automatic publication targets. Every provider still requires verification, consent, and admin approval.

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
