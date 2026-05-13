# CareConnect India MVP Completion Report

## Project Summary

CareConnect India MVP v1.2 is an aged care provider discovery platform aligned to the final pan-India city-aware brief. Families select or auto-detect an active city first, then search city-scoped providers by service, area/suburb, language, verified status, and listing tier. Providers register under one active city. City activation, provider approval, and verification remain manual through Supabase Studio.

The MVP supports Stripe, Resend, and Twilio WhatsApp foundations, but local integrations can remain unconfigured. Current data includes sample/demo providers for testing only. Real launch requires production credentials, storage setup, staging QA, at least 2 active cities, 50+ verified real providers, and verified provider onboarding with consent city by city.

## Developer Brief Compliance Matrix

| Requirement | Status | Notes |
| --- | --- | --- |
| Families can search providers | Complete | Homepage and `/search` are implemented. |
| Families can filter by service type | Complete | `service_type` filter is supported. |
| Families can filter by city | Complete | City selector is primary. `city` is the main public search parameter. |
| Families can filter by area/suburb | Complete | Area/suburb filter is scoped to the selected city. |
| Families can filter by languages spoken | Complete | `language` filter is supported. |
| Families can filter by verified badge | Complete | `verified=true` API and UI filter added. |
| Families can contact providers | Complete | Enquiry form saves to Supabase. |
| Provider public profiles exist | Complete | Active providers have SSR profile pages. |
| Provider SEO profile pages | Complete | Dynamic metadata added for active providers. |
| Providers can register | Complete | Clerk-protected provider registration requires one active city. |
| Providers can manage profile | Complete | Dashboard profile editor exists. |
| Providers can upload logo | Complete | Supabase Storage upload route added. |
| Providers can view leads | Complete | Leads dashboard exists. |
| Providers can view analytics | Complete | Standard/Premium analytics page enabled; Free sees upgrade prompt. |
| Admin approval through Supabase Studio | Complete | `is_active` remains manually managed. |
| Admin city activation through Supabase Studio | Complete | `cities.is_active` controls active public cities. |
| Verified badge through admin | Complete | `is_verified` remains manually managed. Public UI shows badge only for Standard/Premium. |
| Free listing plan | Complete | Search and dashboard-only leads supported. |
| Standard listing plan | Complete | Priority, email lead alert foundation, analytics, logo, verified eligibility. |
| Premium listing plan | Complete | Highest priority, highlighted search card, email and WhatsApp foundation, analytics, logo, verified eligibility. |
| Stripe billing foundation | Complete | Checkout and webhook APIs implemented. Requires Stripe setup. |
| Resend email foundation | Complete | Family and provider email helpers implemented. Requires Resend setup. |
| Twilio WhatsApp foundation | Complete | Premium WhatsApp helper implemented. Requires Twilio setup. |
| No online booking | Complete | Intentionally excluded. |
| No appointment scheduling | Complete | Intentionally excluded. |
| No in-app chat | Complete | Intentionally excluded. |
| No reviews or ratings | Complete | Intentionally excluded. |
| No family accounts | Complete | Intentionally excluded. |
| No custom admin dashboard | Complete | Intentionally excluded. |
| Pan-India city-aware discovery | Complete | Active cities are admin-managed and public search is city-scoped. |

## Completed Items

Foundation:

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Shared layout, header, footer
- Environment example and check script

Supabase database:

- `cities`
- `providers`
- `enquiries`
- `provider_analytics`
- RLS policies
- Analytics RPC
- Seed data

Public search:

- Homepage search with city selector, auto-detect button, and service selector
- Search results
- Filters for service, city-scoped area/suburb, language, verified, and tier
- Unsupported or inactive cities show a waitlist-style prompt
- Premium/Standard/Free ordering
- Empty and error states

Provider profiles:

- Public profile pages for active providers
- Dynamic SEO metadata
- Pricing badge
- Verified badge display restricted to Standard/Premium
- Logo display restricted to Standard/Premium
- Provider not found state

Enquiry flow:

- Public family enquiry form
- Enquiry saving
- Analytics count update
- Resend confirmation/provider email attempts after save
- Twilio WhatsApp attempt for Premium providers after save
- Delivery status update when provider delivery succeeds

Provider auth:

- Clerk sign-in/sign-up
- Protected provider routes
- Provider registration linked to Clerk user ID

Provider dashboard:

- Current approval, verification, plan, and lead delivery summary
- Profile actions
- Billing link

Leads:

- Provider leads page
- Delivery method and status display
- Empty state for no enquiries

Analytics:

- Internal analytics tracking remains active for all providers
- Detailed analytics page restricted to Standard/Premium
- Free providers see upgrade prompt

Billing foundation:

- Plan definitions
- Billing page
- Stripe Checkout API
- Stripe webhook API
- Clean missing-configuration handling

Email/WhatsApp foundation:

- Resend server-only helper
- Twilio server-only helper
- Failures do not block enquiry creation

Admin via Supabase Studio:

- City activation/deactivation through `cities.is_active`
- Approval through `is_active`
- Verification through `is_verified`
- Listing tier can be inspected and corrected manually if required

## Final City-Aware Brief Alignment

- The platform now follows a pan-India city-aware architecture.
- City selector is the primary public search entry point.
- City-scoped `GET /api/providers?city=` is the primary provider search API.
- `GET /api/cities` returns active cities from the admin-managed `cities` table.
- Broad `location=` support remains only as a backward-compatible alias.
- Area/suburb filters are scoped to the selected city.
- Unsupported or inactive cities show a waitlist-style prompt.
- City directory migration lives in `supabase/migrations/202605111700_create_cities_table.sql`.
- Pan-India city directory seed lives in `supabase/seed-cities-india.sql`.
- City-aware sample/demo seed data lives in `supabase/seed-city-aware-demo.sql`.
- Current data includes sample/demo providers only.
- Sample providers are not real providers and do not represent verified real provider coverage.
- No fake real provider data is included; demo rows must stay clearly labelled as sample/demo.
- Real launch requires at least 2 active cities, 50+ verified real providers, and provider consent city by city.

## Remaining Before Real Launch

- Add verified real provider records city by city.
- Keep at least 2 launch cities active.
- Onboard 50+ verified real providers before public launch.
- Verify provider data quality, consent, and contact details.
- Create Stripe account, products, prices, and webhook.
- Add Stripe environment variables in Vercel.
- Configure Resend API key, sender, and production domain.
- Configure Twilio WhatsApp Sandbox or production WhatsApp sender.
- Create Supabase Storage bucket `provider-logos`.
- Rotate Supabase service role key before production.
- Deploy Vercel preview.
- Run founder staging review.
- Run live end-to-end billing, email, WhatsApp, and enquiry tests.

## Acceptance Criteria Status

Consumer experience:

- Complete for MVP. Families can search, filter, view providers, and submit enquiries.

Provider experience:

- Complete for MVP. Providers can register, edit profile, upload logo, view leads, access plan-eligible analytics, and manage billing.

Admin and data:

- Complete for MVP. Admin uses Supabase Studio for city activation, provider approval, and verification.

Launch readiness:

- Technically ready for Vercel deployment preparation.
- Not ready for public launch until provider data, production credentials, security rotation, and staging QA are complete.

## Final Go-Live Checklist

- Confirm `.env.local` is not committed.
- Rotate Supabase service role key before production.
- Add all required Vercel environment variables.
- Create `provider-logos` Supabase Storage bucket with public read.
- Keep at least 2 cities active in `public.cities`.
- Onboard and approve 50+ verified real providers.
- Approve verified real providers city by city.
- Set verified badges only for eligible Standard/Premium providers unless founder-approved.
- Configure Stripe Standard and Premium recurring prices.
- Configure Stripe webhook endpoint:
  - `https://your-vercel-domain/api/webhooks/stripe`
- Configure Resend sender and test delivery.
- Configure Twilio WhatsApp sender and test delivery.
- Deploy Vercel preview from:
  - `git@github.com:SaiAkhil2003/careconnect-india.git`
- Set `NEXT_PUBLIC_APP_URL` to the Vercel domain.
- Test public pages, provider auth, enquiry creation, billing, webhook, email, and WhatsApp flows.
- Founder approves staging build.
- Promote to production.
