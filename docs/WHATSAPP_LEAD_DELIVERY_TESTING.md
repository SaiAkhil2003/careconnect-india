# WhatsApp Lead Delivery Testing

Use these checks before enabling WhatsApp lead delivery for public use. Do not use real provider or family phone numbers unless the recipient is controlled and expecting the test.

## Test Without Twilio Configured

Expected:

- Enquiry saves successfully.
- Provider dashboard shows the lead.
- WhatsApp delivery is skipped safely.
- The API response remains successful after the enquiry is saved.

## Test With Demo Provider

Use a demo provider with a provider name containing `Demo` or `Sample`, an `@example.com` provider/lead email, or a fake `90000` WhatsApp number.

Expected:

- Enquiry saves successfully.
- Provider dashboard shows the lead.
- WhatsApp delivery is skipped with `DEMO_WHATSAPP` safety.
- No WhatsApp message is sent to fake demo numbers.

## Test Free Provider

In Supabase Studio:

- Set `listing_tier = free`.
- Keep the provider active for the test.
- Submit an enquiry.

Expected:

- Enquiry saves successfully.
- Provider dashboard shows the lead.
- No WhatsApp delivery is attempted.

## Test Standard Provider

In Supabase Studio:

- Set `listing_tier = standard`.
- Keep the provider active for the test.
- Submit an enquiry.

Expected:

- Enquiry saves successfully.
- Provider dashboard shows the lead.
- No WhatsApp delivery is attempted.
- Provider email delivery still follows the normal Resend configuration and demo email safety.

## Test Premium Provider Missing WhatsApp

In Supabase Studio:

- Set `listing_tier = premium`.
- Clear `lead_whatsapp`.
- Keep the provider active for the test.
- Submit an enquiry.

Expected:

- Enquiry saves successfully.
- Provider dashboard shows the lead.
- WhatsApp delivery is skipped safely.

## Test Premium Provider With Controlled Number

In Supabase Studio:

- Set `listing_tier = premium`.
- Set `lead_whatsapp` to your own WhatsApp number in `whatsapp:+91XXXXXXXXXX` format, or `+91XXXXXXXXXX`.
- Set `lead_email` to your controlled test email if email testing is also needed.
- Do not use `@example.com` provider, lead, or family emails for real WhatsApp testing because demo-safety logic intentionally skips those records.
- Set `is_active = true`.
- Keep test data clearly marked if this is not a real provider.

Submit an enquiry.

Expected:

- Enquiry saves successfully.
- Provider dashboard shows the lead.
- WhatsApp arrives at the controlled `lead_whatsapp`.
- Email delivery, if configured, follows the normal Resend behavior.
- WhatsApp failure never rolls back the saved enquiry.

## Twilio Sandbox Note

The recipient phone must join the Twilio WhatsApp Sandbox before it can receive sandbox messages.

Sandbox environment setup:

- `TWILIO_WHATSAPP_FROM` must be `whatsapp:+14155238886` for the Twilio Sandbox.
- Recipient `lead_whatsapp` must be formatted as `whatsapp:+91XXXXXXXXXX`, or as `+91XXXXXXXXXX` so the app can add the prefix.
- Vercel must be redeployed after adding or changing Twilio environment variables.
- Demo providers intentionally skip WhatsApp delivery.
- Providers with `Demo` or `Sample` in the name, `@example.com` provider/lead/family emails, or fake `90000` WhatsApp numbers are skipped safely.

Production WhatsApp messaging may require approved templates and a verified WhatsApp Business sender.

## Manual URLs

- `/providers/sai-test-elder-care`
- `/search?city=visakhapatnam`
- `/search?city=bengaluru`

## Expected Summary

- Lead saved every time.
- Dashboard lead count updates.
- WhatsApp skipped for demo/fake providers.
- WhatsApp skipped for Free providers.
- WhatsApp skipped for Standard providers.
- WhatsApp skipped for Premium providers when `lead_whatsapp` is missing.
- WhatsApp sent for Premium providers when Twilio is configured and the recipient joined the sandbox.
- WhatsApp failure never blocks enquiry saving.
