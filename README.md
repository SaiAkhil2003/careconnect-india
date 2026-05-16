# CareConnect India

CareConnect India is an MVP aged care services aggregator aligned to the final pan-India city-aware brief. Families select or auto-detect an active city first, then search city-scoped providers by service, area/suburb, language, verified status, and listing tier. Providers register under one active city. City activation, provider approval, and verified badge management are handled through Supabase Studio for MVP v1.

GitHub repository:

```text
git@github.com:SaiAkhil2003/careconnect-india.git
```

## MVP Purpose

The MVP validates whether families can discover aged care providers inside a selected city and submit enquiries, while providers can receive leads and manage a public profile. Current provider data includes sample/demo listings only for UI testing, search testing, city activation demos, and stakeholder review. Real launch requires manual provider collection, consent, verification, Supabase admin approval, at least 2 active cities, 50+ verified real providers, and founder QA city by city before production rollout.

## City-Aware Search

- Public search is city-scoped. `city` is the primary public search parameter.
- Families select a city on the homepage before viewing providers.
- `/api/cities` returns active cities managed through Supabase Studio.
- Area/suburb filters are scoped to the selected city.
- Broad `location=` search is kept only as a backward-compatible alias in `/api/providers`.
- City-specific area constants live in `src/lib/constants/locations.ts`.
- Pan-India place suggestions and the city seed are generated from GeoNames India gazetteer data. Source and license notes live in `docs/PLACE_DATA_SOURCES.md`.
- Sample/demo providers are available only for development and testing.
- Sample providers are not real providers and do not represent verified real provider coverage.
- No fake real provider data is included.
- Unsupported or inactive cities show a waitlist-style prompt.

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL and Storage
- Clerk authentication
- Stripe subscriptions
- Resend email
- Twilio WhatsApp
- Vercel deployment target

## Completed Features

- Public homepage search with city selector and service selector
- `/api/cities` active city API
- City-scoped search results with service, area/suburb, language, verified, and tier filters
- Provider cards and SEO-ready provider profile pages
- Enquiry form and enquiry saving
- Provider analytics tracking
- Clerk sign-in/sign-up
- Provider registration on the Free plan
- Provider dashboard
- Provider profile editing
- Provider logo upload support
- Provider leads page
- Standard/Premium analytics page access
- Billing page with Free, Standard, and Premium plan cards
- Stripe Checkout API and webhook foundation
- Safe Resend family acknowledgement and Standard/Premium provider lead alert delivery
- Optional Twilio WhatsApp lead alert foundation for Premium providers
- Admin approval through Supabase Studio

## Roles

Families:

- Search and filter providers.
- View provider profiles.
- Submit enquiries without creating an account.

Providers:

- Sign in with Clerk.
- Register a provider profile.
- Manage profile, logo, lead email, and WhatsApp details.
- View leads.
- View detailed analytics on Standard and Premium plans.
- Upgrade from Billing.

Admin:

- Uses Supabase Studio for MVP approval.
- Sets `is_active` to publish a provider.
- Sets `is_verified` when appropriate.
- Verified badge should normally be awarded only to Standard/Premium providers unless the founder approves otherwise. Public UI hides the badge for Free listings even if `is_verified` is accidentally true.

## Listing Plans

Free:

- Public profile after admin approval
- Appears in search
- Leads stored in dashboard only
- No external provider lead email
- No WhatsApp lead delivery
- No detailed analytics dashboard

Standard:

- Public profile after admin approval
- Better listing priority than Free
- Provider lead alert by email when Resend and provider email are configured
- Detailed analytics dashboard
- Logo display
- Verified badge eligible
- Price: ₹1,999/month

Premium:

- Public profile after admin approval
- Highest listing priority
- Highlighted listing in search
- Provider lead alert by email when configured
- WhatsApp lead alert when Twilio and `lead_whatsapp` are configured
- Detailed analytics dashboard
- Logo display
- Verified badge eligible
- Price: ₹4,999/month

Current MVP registration flow creates providers on the Free plan first. Providers upgrade to Standard or Premium from `/dashboard/billing` after registration. This keeps the MVP simpler while still supporting paid billing.

## Environment Variables

Copy `.env.example` to `.env.local`. Do not commit real keys.

Required:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

Optional integrations:

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STANDARD_PRICE_ID=
STRIPE_PREMIUM_PRICE_ID=

RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=CareConnect India <leads@yourdomain.com>
PLATFORM_ADMIN_EMAIL=admin@example.com

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=

NEXT_PUBLIC_APP_URL=
```

`npm run check-env` prints only `FOUND` or `MISSING`. Missing Stripe, Resend, Twilio, or `NEXT_PUBLIC_APP_URL` values do not fail the build.

## Local Setup

```bash
npm install
npm run check-env
npm run dev
```

Open the local URL shown by Next.js, usually `http://localhost:3000`.

## Supabase Setup

Apply all database migrations with the Supabase CLI if it is installed:

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

### Manual City Setup

To apply city setup manually:

1. Open the Supabase SQL Editor.
2. Run `supabase/migrations/202605111700_create_cities_table.sql`.
3. Run `supabase/seed-cities-india.sql`.
4. Verify `GET /api/cities`.

Expected result:

- Bengaluru appears as an active city.
- Visakhapatnam appears as an active city.
- Inactive cities do not appear in the active city selector.

Optional CLI equivalent:

```bash
npx supabase db push
psql "$SUPABASE_DB_URL" -f supabase/seed-cities-india.sql
```

The CLI is optional. If it is not installed, use the Supabase SQL Editor steps above.

Seed existing sample providers:

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

Seed India-wide sample/demo providers for development and testing:

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed-india-demo.sql
```

`supabase/seed-india-demo.sql` can also be run manually in the Supabase SQL Editor. This sample data is for development/testing only and does not represent verified real provider coverage.

Seed the final city-aware demo data:

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed-city-aware-demo.sql
```

`supabase/seed-cities-india.sql` seeds the pan-India GeoNames city/place directory and keeps only Bengaluru and Visakhapatnam active for MVP testing. `supabase/seed-city-aware-demo.sql` is optional development/testing data that seeds active Bengaluru and Visakhapatnam cities, inactive optional cities, and 10 clearly labelled sample/demo providers across the 2 active cities. It can also be run manually in the Supabase SQL Editor.

### Pan India Demo Provider Data

A Pan India demo provider seed exists for almost every city/place in `public.cities`. Normal cities receive multiple demo provider types, and major cities receive demo providers across all supported service types. These demo providers are not real providers and are only for UI testing, search testing, city activation demos, and stakeholder review.

Real launch requires verified provider onboarding, provider consent, and admin approval. All-city activation is demo only. Production should activate cities only after real provider coverage exists.

To load demo providers:

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed-demo-providers-pan-india.sql
```

To activate all demo cities:

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed-demo-activate-pan-india-cities.sql
```

To remove generated demo providers:

```bash
psql "$SUPABASE_DB_URL" -f supabase/cleanup-demo-providers-pan-india.sql
```

Keep `supabase/seed-demo-activate-pan-india-cities.sql` separate from the main city seed. Safe MVP mode keeps only Bengaluru and Visakhapatnam active by default. Full demo mode activates cities that have generated demo providers.

### Real Provider Sourcing and Verification

Demo data is only for testing and stakeholder review. Real provider data must come from manual collection, provider consent, verification, and Supabase admin approval. Online directories may be used only for lead discovery and market mapping; they must not be treated as verified data or copied into production without direct verification.

Use these workflow files before importing real providers:

- `docs/REAL_PROVIDER_SOURCE_STRATEGY.md`
- `docs/provider-research-tracker-template.csv`
- `docs/PROVIDER_VERIFICATION_CALL_SCRIPT.md`
- `docs/PROVIDER_LISTING_CONSENT_TEXT.md`
- `docs/REAL_PROVIDER_IMPORT_CHECKLIST.md`
- `docs/REAL_PROVIDER_VERIFICATION_PROCESS.md`
- `docs/SUPABASE_PROVIDER_ADMIN_GUIDE.md`
- `docs/PROVIDER_DATA_QUALITY_RULES.md`
- `supabase/provider-import-template.csv`
- `supabase/provider-import-staging-notes.sql`

Admin still uses Supabase Studio in the MVP. Real launch should activate verified providers city by city; demo providers are not real provider coverage.

Providers should not be published unless contact details, service coverage, consent, and admin approval are complete. The recommended launch path is city-by-city real provider onboarding, starting with Visakhapatnam and Bengaluru, then Hyderabad, Chennai, Mumbai, Delhi, Pune, and Kochi.

Recommended collection targets per launch city:

- 10 home care providers.
- 5 senior living or assisted living providers.
- 5 physiotherapy or rehab providers.
- 5 geriatric doctor or clinic providers.
- 5 companion, day care, or dementia care providers.

These are collection targets, not automatic publication targets.

Tables:

- `cities`
- `providers`
- `enquiries`
- `provider_analytics`

Admin approval remains manual in Supabase Studio:

- Set `cities.is_active = true` to activate a city.
- Set `cities.is_active = false` to deactivate a city.
- Set `providers.is_active = true` to publish.
- Set `providers.is_verified = true` for approved verified providers.
- Keep `listing_tier` aligned with billing status.

## Supabase Storage Setup

Create a Storage bucket:

```text
provider-logos
```

Recommended MVP setting:

- Public read enabled for logo display.

Provider logo upload uses:

```text
provider-id/timestamp-filename
```

If the bucket is missing, the profile page returns:

```text
Provider logo storage is not configured yet.
```

## Clerk Setup

1. Create a Clerk application.
2. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
3. Add `CLERK_SECRET_KEY`.
4. Configure sign-in and sign-up URLs for the Next.js routes:
   - `/sign-in`
   - `/sign-up`
5. Confirm `/dashboard` and `/register-provider` require authentication.

## Stripe Setup

1. Create a Stripe account.
2. Create a Standard product and monthly recurring price for ₹1,999.
3. Create a Premium product and monthly recurring price for ₹4,999.
4. Add the price IDs:
   - `STRIPE_STANDARD_PRICE_ID`
   - `STRIPE_PREMIUM_PRICE_ID`
5. Add `STRIPE_SECRET_KEY`.
6. Add `NEXT_PUBLIC_APP_URL`.
7. Add webhook endpoint:
   - Local or deployed URL ending in `/api/webhooks/stripe`
8. Listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
9. Add `STRIPE_WEBHOOK_SECRET`.

The webhook updates provider billing fields and `listing_tier`. It does not approve or verify providers.

## Resend Setup

1. Create a Resend account.
2. Add a sending domain.
3. Verify SPF and DKIM records for the sending domain.
4. Create a Resend API key.
5. Add `RESEND_API_KEY` locally and in Vercel.
6. Add `RESEND_FROM_EMAIL`, for example `CareConnect India <leads@yourdomain.com>`.
7. Add `PLATFORM_ADMIN_EMAIL` if admin lead notification copies should be sent.
8. Use a verified sender or verified domain in production.
9. Test with one real controlled email address before public use.

Email delivery is skipped when Resend is not configured. Enquiry creation still succeeds. Provider lead emails are sent only for Standard and Premium providers with `lead_email` configured. Free provider leads remain dashboard-only. Demo `@example.com` addresses are skipped to avoid sending test data.

## Twilio WhatsApp Setup

1. Create a Twilio account.
2. Use WhatsApp Sandbox for MVP testing.
3. Add `TWILIO_ACCOUNT_SID`.
4. Add `TWILIO_AUTH_TOKEN`.
5. Add `TWILIO_WHATSAPP_FROM`.
6. Test with a sandbox-approved recipient.

WhatsApp lead delivery runs only for Premium providers with `lead_whatsapp` set.

## Manual Testing Checklist

Run:

```bash
npm run check-env
npm run lint
npx tsc --noEmit
npm run build
npm run dev
```

Run `supabase/seed-city-aware-demo.sql` in the target Supabase database before expecting nonzero results for Bengaluru and Visakhapatnam city-aware demo searches.

Public pages:

- `/`
- `/search`
- `/api/cities`
- `/search?city=bengaluru`
- `/search?city=visakhapatnam`
- `/search?city=bengaluru&service_type=home_care`
- `/search?city=hyderabad`
- `/providers/sample-vizag-home-care`
- `/providers/sai-test-elder-care`
- `/register-provider`
- `/about`
- `/how-it-works`
- `/contact`

Auth pages:

- `/sign-in`
- `/sign-up`

Protected pages:

- `/dashboard`
- `/dashboard/profile`
- `/dashboard/leads`
- `/dashboard/analytics`
- `/dashboard/billing`
- `/register-provider`

API checks:

- `GET /api/cities`
- `GET /api/providers`
- `GET /api/providers?city=bengaluru`
- `GET /api/providers?city=visakhapatnam`
- `GET /api/providers?city=bengaluru&service_type=home_care`
- `GET /api/providers?city=hyderabad`
- `GET /api/providers?city=bengaluru&verified=true`
- `GET /api/providers/sample-vizag-home-care`
- `POST /api/enquiries`
- `POST /api/provider/billing/checkout`

Expected:

- Public pages open.
- City selector loads active cities.
- Search requires a city.
- Active cities return city-scoped providers after city-aware seed data is applied.
- Inactive or unsupported cities show a waitlist-style prompt.
- Area/suburb filters are scoped to the selected city.
- Existing provider profile URLs still work.
- Protected pages redirect to sign-in when signed out.
- Billing page opens without Stripe keys when signed in.
- Upgrade attempt without Stripe setup shows `Stripe billing is not configured yet.`
- Free providers see `Analytics are available on Standard and Premium plans.`
- Logo upload without the bucket shows `Provider logo storage is not configured yet.`

## Deployment Steps

Do not deploy automatically from local automation. Prepare Vercel manually:

1. Connect GitHub repo:

```text
git@github.com:SaiAkhil2003/careconnect-india.git
```

2. Import the project in Vercel.
3. Add environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_STANDARD_PRICE_ID
STRIPE_PREMIUM_PRICE_ID
RESEND_API_KEY
RESEND_FROM_EMAIL
PLATFORM_ADMIN_EMAIL
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_FROM
NEXT_PUBLIC_APP_URL
```

4. Set `NEXT_PUBLIC_APP_URL` to the Vercel domain.
5. Deploy preview.
6. Test the preview URL.
7. Add Stripe webhook endpoint:

```text
https://your-vercel-domain/api/webhooks/stripe
```

## Known Limitations

- Stripe is not tested until test or live keys are added.
- Resend is not tested until an API key and sender email are configured.
- Twilio WhatsApp is not tested until sandbox or production WhatsApp is configured.
- Current data includes sample/demo providers only.
- Sample providers are not real providers.
- Real launch requires at least 2 active cities and 50+ verified real providers.
- Real launch requires verified provider onboarding and consent city by city.
- Online directories are lead discovery sources only, not verification sources.
- Real providers should be published only after verification, consent, and admin approval.
- Supported city areas are configurable in `src/lib/constants/locations.ts`.
- Broad `location=` search is backward-compatible only; the main public flow uses `city=`.
- Admin approval is through Supabase Studio.
- City activation/deactivation is through Supabase Studio.
- No custom admin dashboard in MVP.
- Provider logo display requires the `provider-logos` bucket.
- Local seed data is for MVP testing only.

## Features Excluded From MVP

- Online booking
- Appointment scheduling
- In-app chat
- Reviews
- Ratings
- Family accounts
- Saved providers
- AI recommendations
- Mobile app
- Custom admin dashboard
- Provider staff management

## Security Notes

- Never commit `.env.local`.
- `SUPABASE_SERVICE_ROLE_KEY` must be used only on the server.
- Supabase service role key must be rotated before production because it was exposed during local testing.
- Do not print real keys in logs.
- Rotate any credential that is accidentally pasted into chat, terminal output, screenshots, or committed files.
- Stripe webhook verification uses the raw request body and `STRIPE_WEBHOOK_SECRET`.
- Optional integrations fail closed with clean user-facing setup messages.

## Final MVP Status

CareConnect India is ready for Vercel deployment preparation and staging QA after required production/test environment variables are configured.
