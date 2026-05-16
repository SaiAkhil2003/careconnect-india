import "server-only";

import twilio from "twilio";
import type { ListingTier } from "@/lib/types";

type WhatsAppDeliveryReason =
  | "DEMO_WHATSAPP"
  | "WHATSAPP_NOT_CONFIGURED"
  | "WHATSAPP_SEND_FAILED";

type ProviderWhatsAppLeadAlertInput = {
  providerName: string;
  providerCity: string | null;
  providerEmail?: string | null;
  leadEmail?: string | null;
  listingTier: ListingTier | null;
  leadWhatsapp: string | null;
  familyName: string;
  familyPhone: string;
  familyEmail?: string | null;
  serviceNeeded: string;
  message?: string | null;
  submittedAt?: string | null;
};

type LegacyProviderWhatsAppLeadInput = {
  listing_tier: ListingTier | null;
  lead_whatsapp: string | null;
  provider_name: string;
  family_name: string;
  family_phone: string;
  service_needed: string;
  message: string | null;
};

export type WhatsAppDeliveryResult =
  | {
      success: true;
      skipped: false;
      provider: "twilio";
      messageId?: string;
    }
  | {
      success: false;
      skipped: true;
      reason: WhatsAppDeliveryReason;
    }
  | {
      success: false;
      skipped: false;
      provider: "twilio";
      reason: WhatsAppDeliveryReason;
    };

const serviceLabels: Record<string, string> = {
  home_care: "Home Care",
  senior_living: "Senior Living",
  day_care: "Day Care",
  physio: "Physiotherapy",
  geriatric_doctor: "Geriatric Doctor",
  companion: "Companion Care",
  dementia_care: "Dementia Care",
};

const skippedDemoWhatsApp: WhatsAppDeliveryResult = {
  success: false,
  skipped: true,
  reason: "DEMO_WHATSAPP",
};

const skippedNotConfigured: WhatsAppDeliveryResult = {
  success: false,
  skipped: true,
  reason: "WHATSAPP_NOT_CONFIGURED",
};

const failedSend: WhatsAppDeliveryResult = {
  success: false,
  skipped: false,
  provider: "twilio",
  reason: "WHATSAPP_SEND_FAILED",
};

function formatWhatsAppAddress(value: string) {
  const trimmed = value.trim();

  if (trimmed.toLowerCase().startsWith("whatsapp:")) {
    return trimmed;
  }

  return `whatsapp:${trimmed}`;
}

function formatServiceLabel(serviceNeeded: string) {
  return serviceLabels[serviceNeeded] ?? serviceNeeded;
}

function isExampleEmail(email: string | null | undefined) {
  return Boolean(email?.trim().toLowerCase().endsWith("@example.com"));
}

function isDemoWhatsAppLead(input: ProviderWhatsAppLeadAlertInput) {
  const providerName = input.providerName.trim().toLowerCase();
  const leadWhatsapp = input.leadWhatsapp?.trim() ?? "";

  return (
    providerName.includes("demo") ||
    providerName.includes("sample") ||
    isExampleEmail(input.providerEmail) ||
    isExampleEmail(input.leadEmail) ||
    leadWhatsapp.includes("90000")
  );
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
  const errorRecord =
    typeof error === "object" && error !== null
      ? (error as { code?: unknown; status?: unknown })
      : {};
  const errorName = error instanceof Error ? error.name : "UnknownError";
  const errorCode =
    typeof errorRecord.code === "string" ||
    typeof errorRecord.code === "number"
      ? errorRecord.code
      : "unknown";
  const errorStatus =
    typeof errorRecord.status === "string" ||
    typeof errorRecord.status === "number"
      ? errorRecord.status
      : "unknown";

  console.error(
    `Provider WhatsApp lead alert failed (${errorName}, code=${errorCode}, status=${errorStatus})`,
  );
}

export async function sendProviderWhatsAppLeadAlert(
  input: ProviderWhatsAppLeadAlertInput,
): Promise<WhatsAppDeliveryResult> {
  if (input.listingTier !== "premium") {
    return skippedNotConfigured;
  }

  if (isDemoWhatsAppLead(input)) {
    return skippedDemoWhatsApp;
  }

  if (!input.leadWhatsapp?.trim()) {
    return skippedNotConfigured;
  }

  const setup = getTwilioSetup();

  if (!setup) {
    return skippedNotConfigured;
  }

  try {
    const serviceLabel = formatServiceLabel(input.serviceNeeded);
    const result = await setup.client.messages.create({
      from: setup.from,
      to: formatWhatsAppAddress(input.leadWhatsapp),
      body: [
        "New CareConnect India enquiry",
        "",
        `Provider: ${input.providerName}`,
        `City: ${input.providerCity ?? "Unknown city"}`,
        `Service: ${serviceLabel}`,
        "",
        `Family: ${input.familyName}`,
        `Phone: ${input.familyPhone}`,
        `Email: ${input.familyEmail ?? "Not provided"}`,
        "",
        "Message:",
        input.message ?? "Not provided",
        "",
        "This lead was generated through CareConnect India.",
      ].join("\n"),
    });

    return {
      success: true,
      skipped: false,
      provider: "twilio",
      messageId: result.sid,
    };
  } catch (error) {
    logWhatsAppFailure(error);
    return failedSend;
  }
}

export async function sendProviderWhatsAppLead(
  input: LegacyProviderWhatsAppLeadInput,
) {
  const result = await sendProviderWhatsAppLeadAlert({
    providerName: input.provider_name,
    providerCity: null,
    listingTier: input.listing_tier,
    leadWhatsapp: input.lead_whatsapp,
    familyName: input.family_name,
    familyPhone: input.family_phone,
    serviceNeeded: input.service_needed,
    message: input.message,
  });

  return result.success;
}
