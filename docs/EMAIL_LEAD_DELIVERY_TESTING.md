# Email Lead Delivery Testing

Use these checks before enabling email lead delivery for public use. Do not use real provider or family emails unless the recipient is controlled and expecting the test.

## Test Without Resend Configured

Expected:

- Enquiry saves successfully.
- Provider dashboard shows the lead.
- Provider email delivery is skipped safely.
- Family acknowledgement is skipped safely if Resend is not configured.
- The API response remains successful after the enquiry is saved.

## Test With Demo Provider

Use a demo provider that has `@example.com` email addresses.

Expected:

- Enquiry saves successfully.
- Provider dashboard shows the lead.
- Email delivery is skipped with demo email safety.
- No email is sent to `@example.com`.

## Test With Real Controlled Test Provider

In Supabase Studio:

- Set `listing_tier = standard` or `listing_tier = premium`.
- Set `lead_email` to your own controlled test email address.
- Set `is_active = true`.
- Keep test data clearly marked if this is not a real provider.

Submit an enquiry.

Expected:

- Enquiry saves successfully.
- Provider dashboard shows the lead.
- Provider lead email arrives at the controlled `lead_email`.
- Email failure, if any, does not roll back the saved enquiry.

## Test Family Acknowledgement

Submit an enquiry with your own controlled family email address.

Expected:

- Enquiry saves successfully.
- Family acknowledgement email arrives.
- The family email does not expose provider private `lead_email`.
- The email does not promise guaranteed contact or medical suitability.

## Test Free Provider

In Supabase Studio:

- Set `listing_tier = free`.
- Keep the provider active for the test.
- Submit an enquiry.

Expected:

- Enquiry saves successfully.
- Provider dashboard shows the lead.
- No provider lead email is sent.
- Any family acknowledgement still follows normal Resend configuration and demo email safety.

## Manual URLs

- `/providers/sai-test-elder-care`
- `/search?city=visakhapatnam`
- `/search?city=bengaluru`

## Expected Summary

- Lead saved every time.
- Dashboard lead count updates.
- Email skipped for demo `@example.com`.
- Provider email skipped for Free providers.
- Provider email sent for Standard/Premium providers when Resend is configured and `lead_email` is a real controlled address.
- Email failure never blocks enquiry saving.
