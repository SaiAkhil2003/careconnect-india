# CareConnect India

CareConnect India is an MVP aged care services aggregator with India-wide location search. Families can search by state, city, or locality, filter, compare, and contact aged care providers. Providers can register, manage profiles, view leads, view plan-eligible analytics, and upgrade listing tiers. Admin approval and verified badge management are handled through Supabase Studio for MVP v1.

GitHub repository:

```text
git@github.com:SaiAkhil2003/careconnect-india.git
```

## MVP Purpose

The MVP validates whether families can discover aged care providers by location and submit enquiries, while providers can receive leads and manage a public profile. Current provider data includes sample/demo listings only. Real launch requires verified provider onboarding, consent, and manual founder QA city by city before production rollout.

## Location Search

- Public search supports state, city, and locality searches through a configurable supported location list.
- The current supported list lives in `src/lib/constants/locations.ts`.
- Sample/demo providers are available only for development and testing.
- Sample providers are not real providers and do not represent verified real provider coverage.
- Real India-wide coverage must be added through verified provider onboarding city by city.

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

- Public homepage search with searchable location input
- India-wide state, city, and locality search suggestions
- Search results with service, location, language, verified, and tier filters
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
- Resend family confirmation and provider lead alert foundation
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

RESEND_API_KEY=
RESEND_FROM_EMAIL=
PLATFORM_ADMIN_EMAIL=

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

Apply the database migration:

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

Seed existing sample providers:

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

Seed India-wide sample/demo providers for development and testing:

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed-india-demo.sql
```

`supabase/seed-india-demo.sql` can also be run manually in the Supabase SQL Editor. This sample data is for development/testing only and does not represent verified real provider coverage.

Tables:

- `providers`
- `enquiries`
- `provider_analytics`

Admin approval remains manual in Supabase Studio:

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
2. Add `RESEND_API_KEY`.
3. Add a verified sender or test sender.
4. Add `RESEND_FROM_EMAIL`.

Email delivery is skipped when Resend is not configured. Enquiry creation still succeeds.

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

Run `supabase/seed-india-demo.sql` in the target Supabase database before expecting nonzero results for the new India demo city and locality searches.

Public pages:

- `/`
- `/search`
- `/search?location=Hyderabad`
- `/search?location=Banjara%20Hills`
- `/search?location=Telangana`
- `/search?location=Bengaluru`
- `/search?location=T%20Nagar`
- `/search?location=Mumbai`
- `/search?location=Delhi`
- `/search?location=Kochi`
- `/search?service_type=home_care&location=Hyderabad`
- `/search?verified=true&location=Hyderabad`
- `/providers/sample-vizag-home-care`
- `/providers/sai-test-elder-care`
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

- `GET /api/providers`
- `GET /api/providers?location=Hyderabad`
- `GET /api/providers?location=Hyderabad&service_type=home_care`
- `GET /api/providers?location=Telangana`
- `GET /api/providers?location=Bengaluru`
- `GET /api/providers?location=T%20Nagar`
- `GET /api/providers?location=Mumbai`
- `GET /api/providers?location=Delhi`
- `GET /api/providers?verified=true`
- `GET /api/providers?verified=true&location=Hyderabad`
- `GET /api/providers/sample-vizag-home-care`
- `POST /api/enquiries`
- `POST /api/provider/billing/checkout`

Expected:

- Public pages open.
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
- Real launch requires verified provider onboarding and consent city by city.
- Supported locations are configurable in `src/lib/constants/locations.ts`.
- Admin approval is through Supabase Studio.
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
