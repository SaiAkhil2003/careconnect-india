# Stripe Billing Testing

Use these checks before enabling paid provider plans for public use. Use Stripe test mode only. Do not use real cards or live Stripe charges for MVP billing verification.

## Stripe Setup

1. Enable Stripe test mode.
2. Create a Standard recurring monthly price for the Standard plan.
3. Create a Premium recurring monthly price for the Premium plan.
4. Copy the Standard and Premium price IDs.
5. Add environment variables locally and in Vercel:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_STANDARD_PRICE_ID`
   - `STRIPE_PREMIUM_PRICE_ID`
   - `NEXT_PUBLIC_APP_URL`
6. Configure the Vercel webhook endpoint:
   - `https://careconnect-india.vercel.app/api/webhooks/stripe`
7. Add webhook events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
8. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`.
9. Redeploy Vercel after adding or changing Stripe environment variables.

For production Vercel testing, set:

```bash
NEXT_PUBLIC_APP_URL=https://careconnect-india.vercel.app
```

## Test Cards

Use Stripe test cards only. Do not use real cards.

## Local Non-Payment Checks

Run:

```bash
npm run check-env
npm run lint
npx tsc --noEmit
npm run build
npm run dev
```

Expected:

- `/dashboard/billing` loads for a signed-in provider.
- Free, Standard, and Premium plan cards are visible.
- The current plan is clearly marked.
- Free does not open checkout.
- Standard and Premium buttons call the checkout API.
- If Stripe is not configured, the UI shows `Stripe billing is not configured.`
- Unauthenticated checkout API requests return `Unauthenticated.`

## Manual Test Flow

1. Sign in as a provider account with a controlled provider profile.
2. Open `/dashboard/billing`.
3. Click Standard checkout.
4. Complete Checkout using a Stripe test card.
5. Confirm the success redirect returns to the billing page.
6. Confirm the provider row has:
   - `listing_tier = standard`
   - `stripe_customer_id` populated
   - `stripe_subscription_id` populated
7. Repeat with Premium checkout.
8. Confirm the provider row has `listing_tier = premium`.
9. If `lead_whatsapp` is set and Twilio is configured, confirm Premium WhatsApp lead delivery still works after the webhook updates the tier.

## Expected Behavior

- Free providers stay Free unless a successful Stripe checkout webhook upgrades them.
- Standard checkout upgrades `listing_tier` to `standard` after `checkout.session.completed`.
- Premium checkout upgrades `listing_tier` to `premium` after `checkout.session.completed`.
- `customer.subscription.updated` keeps Standard/Premium for `active` or `trialing` subscriptions when the plan can be resolved.
- `customer.subscription.updated` downgrades to Free for `canceled`, `unpaid`, and `incomplete_expired` subscriptions.
- `customer.subscription.deleted` downgrades to Free and clears `stripe_subscription_id`.
- `stripe_customer_id` is retained after subscription deletion so prior Stripe customer history remains linked.
- `is_verified` is not automatically changed by Stripe.
- `is_active` is not automatically changed by Stripe.

## Safety Notes

- Do not expose Stripe secrets in logs, screenshots, or commits.
- Do not commit `.env.local`.
- Use only Stripe test mode while validating MVP billing.
- Webhooks do not approve, verify, activate, or deactivate providers.
