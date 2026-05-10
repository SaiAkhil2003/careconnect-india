# CareConnect India

CareConnect India is an MVP aged care services aggregator for Visakhapatnam. Families search for aged care providers and submit enquiries. Providers register, create listings, manage leads, view basic analytics, and upgrade listing plans. Admin approval is still handled manually through Supabase Studio for the MVP.

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Clerk provider authentication
- Stripe subscriptions for paid listing tiers
- Resend transactional email
- Twilio WhatsApp delivery for Premium providers, optional
- Vercel for deployment

## Prompt 5 Features

- Stripe billing foundation for Standard and Premium provider listings
- Provider billing page at `/dashboard/billing`
- Stripe Checkout session API at `/api/provider/billing/checkout`
- Stripe webhook API at `/api/webhooks/stripe`
- Plan rules for Free, Standard, and Premium listings
- Premium-first search ordering with verified providers ahead inside each tier
- Resend family confirmation and provider lead alert helpers
- Optional Twilio WhatsApp lead alerts for Premium providers
- Enquiry delivery status updates without blocking saved enquiries
- Safe environment checks for required core keys and optional integrations

## Local Setup

```bash
npm install
npm run check-env
npm run dev
```

Open `http://localhost:3000` after the dev server starts.

## Environment Variables

Copy `.env.example` to `.env.local` and set the values needed for your local environment. Do not commit real keys.

Required core keys:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

Optional integration keys:

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

`npm run check-env` prints only `FOUND` or `MISSING` for each key. Missing optional Stripe, Resend, Twilio, or app URL keys do not fail the check or the build. Routes return clean setup errors only when those integrations are used.

## Supabase Setup

Create a Supabase project, then apply the migration.

Hosted Supabase:

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

Local Supabase:

```bash
npx supabase start
npx supabase db reset
```

Seed sample development providers:

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

You can also paste `supabase/seed.sql` into the Supabase Studio SQL Editor.

## Database

Migration file:

```text
supabase/migrations/202605090001_create_backend_foundation.sql
```

Tables:

- `providers`
- `enquiries`
- `provider_analytics`

The providers table includes Stripe customer/subscription fields, lead email, lead WhatsApp, approval flags, verification flags, and listing tier. The enquiries table includes delivery status and delivery method.

## Listing Plans

Free:

- Public profile after admin approval
- Appears in search
- Leads are stored in the dashboard only
- No external provider email or WhatsApp lead delivery

Standard:

- Public profile after admin approval
- Better listing priority than Free
- Provider lead alert by email when Resend and provider email are configured
- Basic analytics
- Price: ₹1,999/month

Premium:

- Public profile after admin approval
- Highest listing priority
- Highlighted listing in search
- Provider lead alert by email when configured
- Provider WhatsApp lead alert when Twilio and `lead_whatsapp` are configured
- Basic analytics
- Price: ₹4,999/month

## Stripe Setup

1. Create a Stripe account.
2. Create a Standard product and monthly recurring price for ₹1,999.
3. Create a Premium product and monthly recurring price for ₹4,999.
4. Copy the price IDs into `.env.local` as `STRIPE_STANDARD_PRICE_ID` and `STRIPE_PREMIUM_PRICE_ID`.
5. Add `STRIPE_SECRET_KEY` to `.env.local`.
6. Add a webhook endpoint ending in `/api/webhooks/stripe`.
7. Listen to these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
8. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
9. Set `NEXT_PUBLIC_APP_URL`, for example `http://localhost:3000` locally or your deployed URL in production.

The webhook updates only `listing_tier`, `stripe_customer_id`, and `stripe_subscription_id`. It does not change `is_active` or `is_verified`.

## Resend Setup

1. Create a Resend account.
2. Add `RESEND_API_KEY` to `.env.local`.
3. Use a verified sender email or the Resend test sender.
4. Add `RESEND_FROM_EMAIL` to `.env.local`.

Family confirmation emails and provider lead alert emails are skipped when Resend is not configured. Email failure does not block enquiry creation.

## Twilio WhatsApp Setup

1. Create a Twilio account.
2. Use the WhatsApp Sandbox for testing.
3. Add `TWILIO_ACCOUNT_SID` to `.env.local`.
4. Add `TWILIO_AUTH_TOKEN` to `.env.local`.
5. Add `TWILIO_WHATSAPP_FROM` to `.env.local`.
6. Test with a sandbox-approved WhatsApp recipient.

WhatsApp lead alerts are sent only for Premium providers with `lead_whatsapp` set. Twilio failure does not block enquiry creation.

## API Routes

### `GET /api/providers`

Returns active providers only. Premium listings are ordered first, then Standard, then Free. Verified providers appear before non-verified providers inside the same tier.

Supported query params:

- `service_type`
- `area`
- `language`
- `tier`
- `page` default `1`
- `limit` default `10`, capped at `50`

### `GET /api/providers/[slug]`

Returns one active provider by slug and increments today's profile view count.

### `POST /api/enquiries`

Creates an enquiry and increments today's enquiry count. After the enquiry is saved, it attempts family confirmation email, provider email delivery for Standard and Premium providers, and WhatsApp delivery for Premium providers.

The response includes:

```json
{
  "success": true,
  "data": {
    "enquiry": {},
    "delivery_summary": {
      "family_email_attempted": true,
      "provider_email_attempted": true,
      "whatsapp_attempted": false,
      "provider_delivery_success": true
    }
  }
}
```

### `POST /api/provider/billing/checkout`

Creates a Stripe Checkout subscription session for the signed-in provider. Allowed tiers are `standard` and `premium`.

If Stripe is not configured, the route returns:

```json
{
  "success": false,
  "error": "Stripe billing is not configured yet."
}
```

### `POST /api/webhooks/stripe`

Verifies the Stripe webhook signature using the raw request body and updates provider listing tier fields for supported subscription events.

## Provider Portal URLs

- `/dashboard`
- `/dashboard/profile`
- `/dashboard/leads`
- `/dashboard/analytics`
- `/dashboard/billing`

## Public Test URLs

- `/`
- `/search`
- `/providers/sample-vizag-home-care`
- `/providers/sai-test-elder-care`

## QA Checklist

Run:

```bash
npm run check-env
npm run lint
npx tsc --noEmit
npm run build
npm run dev
```

Manual checks:

- Billing page loads without Stripe keys.
- Upgrade click without Stripe keys shows `Stripe billing is not configured yet.`
- Standard checkout redirects when Stripe keys and Standard price ID are configured.
- Premium checkout redirects when Stripe keys and Premium price ID are configured.
- Stripe webhook updates `listing_tier` after test subscription events.
- Standard provider enquiry saves and sends provider email when Resend is configured.
- Premium provider enquiry saves and sends email plus WhatsApp when Resend and Twilio are configured.
- Missing Stripe, Resend, or Twilio keys never break the build.

## MVP Scope Exclusions

Do not add these in the MVP:

- Appointment booking
- In-app chat
- Reviews or ratings
- Family login
- Saved providers
- Mobile app
- AI recommendations
- Admin dashboard
- Complex invoice UI
- Provider staff management
- National expansion

## Next Step After Prompt 5

After Stripe, Resend, and Twilio are manually configured and tested, the next practical step is a controlled end-to-end staging QA pass with real provider test accounts, Stripe test subscriptions, and Resend/Twilio sandbox delivery.
