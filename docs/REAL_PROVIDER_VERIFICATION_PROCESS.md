# Real Provider Verification Process

This process is for onboarding real providers without a custom admin dashboard. Demo/sample providers remain only for UI testing, search testing, city activation demos, and stakeholder review.

## 1. Data Source Capture

- Start every real provider record in `supabase/provider-import-template.csv` or a working copy of that template.
- Record `source`, `source_url`, `contact_person`, and `admin_notes`.
- Public directories may be used for discovery only. Do not copy unverified claims into production listings.
- Do not publish a row only because it appears in a public directory.

## 2. Phone/Email Verification

- Call the public phone number or the contact person.
- Confirm that the provider is reachable and currently operating.
- Confirm the public `phone`, public `email`, `lead_email`, and `lead_whatsapp`.
- `lead_email` may differ from the public email.
- Add WhatsApp lead delivery only if the provider agrees to receive WhatsApp leads.

## 3. Website or Public Presence Check

- Check the provider website if one is available.
- If there is no website, check another public presence such as a known business profile, clinic page, or official social page.
- Use this check to corroborate the provider name, city, services, and public contact details.
- Do not copy website text directly into `description`.

## 4. Service Category Confirmation

- Confirm one or more supported `service_types`:
  - `home_care`
  - `senior_living`
  - `day_care`
  - `physio`
  - `geriatric_doctor`
  - `companion`
  - `dementia_care`
- Do not invent service categories.
- If a provider offers a related service that does not fit the supported list, record it in `verification_notes` and leave it out of `service_types`.

## 5. City and Area Confirmation

- Confirm the provider's operating `city`.
- The city must exist in `public.cities`.
- Confirm `areas_covered` as locality names inside the selected city.
- Keep providers inactive if city or area coverage is uncertain.

## 6. Consent Confirmation Before Publishing

- Confirm that the provider consents to be listed on CareConnect India.
- Record `consent_status`, `consent_date`, contact person, and consent notes.
- Do not set `is_active = true` until consent is recorded.

## 7. Admin Approval in Supabase Studio

- MVP admin approval happens in Supabase Studio.
- Review the provider row in `public.providers`.
- Confirm city, service types, areas, phone, email, lead email, lead WhatsApp, listing tier, consent, and verification notes.
- Set `is_active = true` only after admin approval.

## 8. Verified Badge Rule

- Set `is_verified = true` only after manual verification.
- Manual verification means phone/email verification plus public presence or source corroboration.
- Do not mark a provider verified based only on scraped or directory data.

## 9. Listing Tier Rule

- Allowed `listing_tier` values are `free`, `standard`, and `premium`.
- Free providers should not receive external lead delivery.
- Standard providers can receive email lead alerts.
- Premium providers can receive email and WhatsApp lead alerts.
- Billing status and founder approval should match the selected tier.

## 10. When to Activate a Provider

Set `is_active = true` only when all are true:

- Provider identity and operating city are confirmed.
- Phone is reachable.
- Email or lead email is valid.
- Service types are confirmed.
- Areas covered are confirmed.
- Consent has been recorded.
- Admin has reviewed the row in Supabase Studio.

Keep `is_active = false` for research leads, incomplete records, demo rows, duplicates, and providers awaiting consent or verification.
