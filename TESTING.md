# CareConnect India Testing

This project uses Playwright for end-to-end, API, responsive, and security smoke coverage.

## Install Dependencies

```bash
npm install
npx playwright install chromium
```

`@playwright/test` is included in `devDependencies`.

## Local Public Tests

Run the full local suite:

```bash
npm run test:e2e
```

The Playwright config starts `next dev` on `http://127.0.0.1:3000` unless `E2E_BASE_URL` is set. Local runs start the app with:

```bash
E2E_TEST_MODE=true
```

That enables deterministic fixtures from `src/lib/testing/e2e-mocks.ts` for public city/provider APIs, enquiry submission, authenticated provider mocks, and Stripe webhook database effects. External Resend and WhatsApp delivery is not performed in local E2E mode.

## Local Authenticated Tests

Authenticated provider E2E coverage runs locally through a test-only auth guard restricted to `E2E_TEST_MODE=true` or `NODE_ENV=test`.

Covered locally:

- Provider registration validation and submission.
- Free, Standard, and Premium tier selection.
- Stripe checkout route calls without real charges.
- Stripe webhook listing-tier updates.
- Provider dashboard, profile edit form, leads, and analytics.
- Anonymous rejection for provider APIs.
- Provider lead scoping.

Run only authenticated provider tests:

```bash
npm run test:e2e -- e2e/provider-authenticated.spec.ts
```

Do not enable `E2E_TEST_MODE=true` in production or staging.

## Environment Variables

For normal development, use `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
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

Do not commit `.env.local` or other real env files.

## Validation Commands

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:report
```

## Run Against Vercel Staging

Use:

```bash
E2E_BASE_URL=https://your-staging-url.vercel.app npm run test:e2e
```

When `E2E_BASE_URL` is set, Playwright does not start a local server and does not enable local mocks. Staging must use non-production Supabase, Clerk, Stripe test mode, Resend test configuration, and WhatsApp sandbox/test configuration.

Required staging setup:

- Clerk: create a dedicated test provider user. Set `CLERK_E2E_SESSION_COOKIE` only in the local shell or CI secret store if running authenticated responsive smoke tests against staging.
- Supabase: seed active Visakhapatnam and Bengaluru cities, `Seaside Elder Care`, `Vizag Companion Care`, `Bengaluru Senior Living`, one inactive provider, one authenticated provider mapped to the Clerk test user, and test enquiries for that provider.
- Stripe: use test-mode keys and test price IDs for Standard and Premium. Configure the staging webhook endpoint with a test webhook secret and use Stripe CLI or test events for webhook validation.
- Resend: use a test sender/domain or a provider key that cannot send to real families.
- WhatsApp/Twilio: use sandbox/test credentials only.

The local fixture-specific assertions expect the seeded names above. Adjust staging seed data or test filters if staging uses different non-production records.

## What Is Mocked Locally

- Public city/provider API data.
- Local enquiry creation response and delivery summary.
- Provider authenticated session, profile state, leads, and analytics.
- Stripe checkout redirect URL and webhook database effects.
- Resend and WhatsApp delivery.

## What Is Real Locally

- Next.js routing and server rendering.
- App Router pages and route handlers.
- Form validation and client behavior.
- Search/filter rendering.
- API route validation behavior.
- Public provider private-field security checks.
- Responsive rendering checks at 375px, 768px, and 1440px.

## Known Blockers

- Full staging authenticated E2E requires a Clerk test session and a seeded provider mapped to that Clerk user.
- Full Supabase integration assertions require an isolated non-production database.
- Real Stripe checkout completion should remain in Stripe test mode and isolated from production billing data.
