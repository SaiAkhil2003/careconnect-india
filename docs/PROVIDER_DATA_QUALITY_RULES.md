# Provider Data Quality Rules

Use these rules for every real provider before admin approval.

## Provider Name

- Must be the provider's legal name or trading name.
- Do not use directory-only aliases unless the provider confirms them.
- Do not use generic names like "Best Elder Care" unless that is the verified trading name.

## Phone

- Must be reachable.
- Use India format where possible, for example `+91 98765 43210`.
- Do not publish disconnected, personal, or unapproved numbers.

## Email

- Must be valid.
- `lead_email` can differ from the public `email`.
- Use `lead_email` for external lead alerts only when the provider agrees.

## WhatsApp

- Only add `lead_whatsapp` if the provider agrees to receive WhatsApp leads.
- Use India format where possible.
- Premium providers can receive WhatsApp lead alerts only when WhatsApp delivery is configured.

## Description

- No exaggerated claims.
- No medical claims without verification.
- Do not copy copyrighted website or directory text.
- Keep descriptions concise. Maximum 500 characters if schema or app validation requires it.

## Services

Use only supported service types:

- `home_care`
- `senior_living`
- `day_care`
- `physio`
- `geriatric_doctor`
- `companion`
- `dementia_care`

## City

- Must match an existing city in `public.cities`.
- Do not activate a provider for a city that has not been added to `public.cities`.
- Keep the provider inactive if city coverage is unclear.

## Areas

- Must be locality names within the selected city.
- Do not use broad state or country names as areas.
- Remove areas the provider does not actually serve.
