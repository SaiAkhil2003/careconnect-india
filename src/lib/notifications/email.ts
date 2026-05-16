import "server-only";

import { Resend } from "resend";
import type { ListingTier } from "@/lib/types";

type EmailDeliveryReason =
  | "NO_RECIPIENT"
  | "DEMO_EMAIL"
  | "RESEND_NOT_CONFIGURED"
  | "RESEND_SEND_FAILED";

export type EmailDeliveryResult =
  | {
      success: true;
      skipped: false;
      status: "sent";
    }
  | {
      success: false;
      skipped: true;
      status: "skipped";
      reason: EmailDeliveryReason;
    }
  | {
      success: false;
      skipped: false;
      status: "failed";
      reason: EmailDeliveryReason;
    };

type FamilyConfirmationInput = {
  family_email: string | null;
  family_name: string;
  provider_name: string;
  service_needed: string;
  provider_is_verified?: boolean | null;
};

type ProviderLeadEmailInput = {
  lead_email: string | null;
  provider_name: string;
  city: string | null;
  family_name: string;
  family_phone: string;
  family_email: string | null;
  service_needed: string;
  message: string | null;
  submitted_at: string | null;
};

type AdminLeadNotificationInput = {
  provider_name: string;
  provider_city: string | null;
  listing_tier: ListingTier | null;
  family_name: string;
  family_phone: string;
  service_needed: string;
  message: string | null;
  lead_delivery_result: string;
};

let resendClient: Resend | null = null;

const serviceLabels: Record<string, string> = {
  home_care: "Home Care",
  senior_living: "Senior Living",
  day_care: "Day Care",
  physio: "Physiotherapy",
  geriatric_doctor: "Geriatric Doctor",
  companion: "Companion Care",
  dementia_care: "Dementia Care",
};

const skippedNoRecipient: EmailDeliveryResult = {
  success: false,
  skipped: true,
  status: "skipped",
  reason: "NO_RECIPIENT",
};

const skippedDemoEmail: EmailDeliveryResult = {
  success: false,
  skipped: true,
  status: "skipped",
  reason: "DEMO_EMAIL",
};

const skippedNotConfigured: EmailDeliveryResult = {
  success: false,
  skipped: true,
  status: "skipped",
  reason: "RESEND_NOT_CONFIGURED",
};

const failedSend: EmailDeliveryResult = {
  success: false,
  skipped: false,
  status: "failed",
  reason: "RESEND_SEND_FAILED",
};

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL?.trim() || null;
}

function getPlatformAdminEmail() {
  return process.env.PLATFORM_ADMIN_EMAIL?.trim() || null;
}

function getEmailSetup() {
  const resend = getResendClient();
  const from = getFromEmail();

  if (!resend || !from) {
    return null;
  }

  return { resend, from };
}

function formatServiceLabel(serviceNeeded: string) {
  return serviceLabels[serviceNeeded] ?? serviceNeeded;
}

function isDemoEmailAddress(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  return normalizedEmail.endsWith("@example.com");
}

function formatSubmittedAt(value: string | null) {
  if (!value) {
    return new Date().toISOString();
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(parsedDate);
}

async function sendEmail(input: {
  to: string | null;
  subject: string;
  text: string;
  context: string;
}) {
  if (!input.to) {
    return skippedNoRecipient;
  }

  if (isDemoEmailAddress(input.to)) {
    return skippedDemoEmail;
  }

  const setup = getEmailSetup();

  if (!setup) {
    return skippedNotConfigured;
  }

  try {
    const result = await setup.resend.emails.send({
      from: setup.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });

    if (result.error) {
      console.error(
        `${input.context}: Resend send failed (${result.error.name}, ${result.error.statusCode ?? "unknown"})`,
      );

      return failedSend;
    }

    return {
      success: true,
      skipped: false,
      status: "sent",
    } satisfies EmailDeliveryResult;
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`${input.context}: ${errorName}`);

    return failedSend;
  }
}

export async function sendFamilyAcknowledgementEmail(
  input: FamilyConfirmationInput,
) {
  return sendEmail({
    to: input.family_email,
    subject: "We received your CareConnect India enquiry",
    context: "Family acknowledgement email failed",
    text: [
      `Hello ${input.family_name}`,
      "",
      "We have received your enquiry.",
      `Provider: ${input.provider_name}`,
      `Service requested: ${formatServiceLabel(input.service_needed)}`,
      "The provider may contact you directly.",
      "If this was a mistake, ignore this email.",
      "",
      "CareConnect India",
    ].join("\n"),
  });
}

export async function sendProviderLeadEmail(input: ProviderLeadEmailInput) {
  const serviceLabel = formatServiceLabel(input.service_needed);

  return sendEmail({
    to: input.lead_email,
    subject: `New CareConnect India enquiry: ${serviceLabel} in ${
      input.city ?? "Unknown city"
    }`,
    context: "Provider lead email failed",
    text: [
      `Provider name: ${input.provider_name}`,
      `Family name: ${input.family_name}`,
      `Phone number: ${input.family_phone}`,
      `Email: ${input.family_email ?? "Not provided"}`,
      `Service needed: ${serviceLabel}`,
      `City: ${input.city ?? "Unknown city"}`,
      "",
      "Message:",
      input.message ?? "No message provided.",
      "",
      `Submitted date/time: ${formatSubmittedAt(input.submitted_at)}`,
      "",
      "Delivery note:",
      "This lead was generated through CareConnect India.",
    ].join("\n"),
  });
}

export async function sendAdminLeadNotificationEmail(
  input: AdminLeadNotificationInput,
) {
  const serviceLabel = formatServiceLabel(input.service_needed);

  return sendEmail({
    to: getPlatformAdminEmail(),
    subject: `CareConnect India lead notification: ${input.provider_name}`,
    context: "Admin lead notification email failed",
    text: [
      `Provider name: ${input.provider_name}`,
      `Provider city: ${input.provider_city ?? "Unknown city"}`,
      `Listing tier: ${input.listing_tier ?? "free"}`,
      "",
      `Family name: ${input.family_name}`,
      `Phone: ${input.family_phone}`,
      `Service: ${serviceLabel}`,
      "",
      "Message:",
      input.message ?? "No message provided.",
      "",
      `Lead delivery result: ${input.lead_delivery_result}`,
    ].join("\n"),
  });
}

export async function sendFamilyEnquiryConfirmation(
  input: FamilyConfirmationInput,
) {
  const result = await sendFamilyAcknowledgementEmail(input);

  return result.success;
}
