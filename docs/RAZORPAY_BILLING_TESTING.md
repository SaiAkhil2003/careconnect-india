# Razorpay Billing Testing

Razorpay is the active India MVP billing path. Stripe India setup is paused/future because onboarding is invite-based, and the existing Stripe code is kept for future/global payment support.

Use Razorpay test mode only. Do not use live Razorpay payments for MVP validation.

## Razorpay Test Setup

1. Open the Razorpay Dashboard.
2. Switch to test mode.
3. Create a Standard subscription plan for ₹1,999/month.
4. Create a Premium subscription plan for ₹4,999/month.
5. Copy the plan IDs.
6. Add environment variables locally and in Vercel:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`
   - `RAZORPAY_STANDARD_PLAN_ID`
   - `RAZORPAY_PREMIUM_PLAN_ID`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
7. Configure the Vercel webhook endpoint:
   - `https://careconnect-india.vercel.app/api/webhooks/razorpay`
8. Add webhook events:
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.updated`
   - `subscription.cancelled`
   - `subscription.halted`
   - `subscription.paused`
   - `subscription.completed`
   - `subscription.resumed`
9. Redeploy Vercel after adding or changing Razorpay environment variables.

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
- Standard and Premium buttons call `/api/provider/billing/razorpay-checkout`.
- Missing Razorpay setup shows `Razorpay billing is not configured.`
- Unauthenticated checkout API requests return `Unauthenticated.`

## Manual Test Flow

1. Sign in as a provider account with a controlled provider profile.
2. Open `/dashboard/billing`.
3. Click the Standard Razorpay checkout button.
4. Complete checkout using Razorpay test payment details only.
5. Confirm the success message returns to the billing page.
6. Confirm the provider row has `listing_tier = standard` after the signed webhook is processed.
7. Repeat with Premium checkout.
8. Confirm the provider row has `listing_tier = premium`.
9. Cancel or pause a test subscription from Razorpay if testing downgrade behavior.
10. Confirm the provider row downgrades to `listing_tier = free` for implemented cancellation/failure events.

## Expected Behavior

- Standard payment upgrades `listing_tier` to `standard`.
- Premium payment upgrades `listing_tier` to `premium`.
- Cancelled, completed, halted, or paused subscription events downgrade `listing_tier` to `free`.
- Resumed, activated, charged, or active subscription update events restore the paid tier from subscription notes or plan ID.
- `is_verified` is not automatically changed.
- `is_active` is not automatically changed.
- Razorpay subscription/customer/payment IDs are not stored in the current schema; webhooks use subscription notes to identify the provider.

## Safety Notes

- Do not expose Razorpay secrets in logs, screenshots, commits, or support messages.
- Do not commit `.env.local`.
- Use only Razorpay test mode while validating MVP billing.
- Webhooks do not approve, verify, activate, or deactivate providers.
- Do not fake webhook payment events without a valid Razorpay webhook signature.
