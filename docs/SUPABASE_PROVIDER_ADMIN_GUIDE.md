# Supabase Provider Admin Guide

MVP provider approval uses Supabase Studio. Do not build or use a custom admin dashboard for provider approval.

## 1. Open Supabase Studio

- Sign in to Supabase.
- Open the CareConnect India project.
- Use an admin account only.

## 2. Go to Providers Table

- Open Table Editor.
- Select `public.providers`.
- Use filters to review pending rows, usually `is_active = false`.

## 3. Review a Provider Row

Before approving, check:

- `provider_name`
- `city`
- `service_types`
- `areas_covered`
- `languages_spoken`
- `phone`
- `email`
- `lead_email`
- `lead_whatsapp`
- `description`
- `website_url`
- `listing_tier`
- `is_verified`
- `is_active`
- `logo_url`

## 4. Confirm Required Operating Details

- Confirm `city` matches an existing row in `public.cities`.
- Confirm `service_types` use only supported service keys.
- Confirm `areas_covered` are locality names inside the selected city.
- Confirm `phone` is reachable.
- Confirm public `email`.
- Confirm `lead_email` for external email lead alerts.
- Confirm `lead_whatsapp` only when the provider agreed to WhatsApp lead delivery.

## 5. Approve Provider

- Set `is_active = true` only after admin approval.
- Keep `is_active = false` while provider details, consent, or verification are incomplete.
- Do not activate providers from raw research or unverified directory data.

## 6. Mark Verified Provider

- Set `is_verified = true` only after manual verification.
- Manual verification requires direct phone/email confirmation and a public presence or source check.
- Keep `is_verified = false` for providers that are approved but not fully verified.

## 7. Set Listing Tier

Allowed values:

- `free`
- `standard`
- `premium`

Lead delivery rules:

- Free: dashboard-only leads; no external provider lead delivery.
- Standard: email lead alerts can be sent when `lead_email` is configured.
- Premium: email and WhatsApp lead alerts can be sent when `lead_email` and `lead_whatsapp` are configured.

## 8. Keep Demo Providers Identifiable

- Demo providers must stay clearly marked as demo/sample in provider name, description, email, or notes.
- Demo providers are for UI testing, search testing, city activation demos, and stakeholder review.
- Do not rename demo rows to look like real providers.

## 9. Avoid Editing Demo Rows Unless Testing

- Do not edit demo provider rows during real onboarding.
- Do not delete demo providers as part of real provider onboarding.
- Do not delete Sai Test Elder Care.
- If testing requires a demo change, keep the row clearly identifiable as demo/sample afterward.

## 10. Never Expose Service Role Keys

- Never paste service role keys into docs, screenshots, tickets, chat, or client-side code.
- Use service role keys only in secure server-side environments.
- Rotate exposed keys immediately if accidental exposure is suspected.
