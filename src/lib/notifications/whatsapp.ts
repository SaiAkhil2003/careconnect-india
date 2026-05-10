import "server-only";

import twilio from "twilio";
import type { ListingTier } from "@/lib/types";

type ProviderWhatsAppLeadInput = {
  listing_tier: ListingTier | null;
  lead_whatsapp: string | null;
  provider_name: string;
  family_name: string;
  family_phone: string;
  service_needed: string;
  message: string | null;
};

function formatWhatsAppAddress(value: string) {
  const trimmed = value.trim();

  if (trimmed.toLowerCase().startsWith("whatsapp:")) {
    return trimmed;
  }

  return `whatsapp:${trimmed}`;
}

function getTwilioSetup() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    return null;
  }

  return {
    client: twilio(accountSid, authToken),
    from: formatWhatsAppAddress(from),
  };
}

function logWhatsAppFailure(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Unknown WhatsApp error";
  console.error(`Provider WhatsApp lead alert failed: ${message}`);
}

export async function sendProviderWhatsAppLead(
  input: ProviderWhatsAppLeadInput,
) {
  if (input.listing_tier !== "premium" || !input.lead_whatsapp) {
    return false;
  }

  const setup = getTwilioSetup();

  if (!setup) {
    return false;
  }

  try {
    await setup.client.messages.create({
      from: setup.from,
      to: formatWhatsAppAddress(input.lead_whatsapp),
      body: [
        `New CareConnect lead for ${input.provider_name}`,
        `Family: ${input.family_name}`,
        `Phone: ${input.family_phone}`,
        `Service: ${input.service_needed}`,
        `Message: ${input.message ?? "No message provided."}`,
      ].join("\n"),
    });

    return true;
  } catch (error) {
    logWhatsAppFailure(error);
    return false;
  }
}
