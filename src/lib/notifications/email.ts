import "server-only";

import { Resend } from "resend";

type FamilyConfirmationInput = {
  family_email: string | null;
  family_name: string;
  provider_name: string;
  service_needed: string;
};

type ProviderLeadEmailInput = {
  lead_email: string | null;
  provider_name: string;
  family_name: string;
  family_phone: string;
  family_email: string | null;
  service_needed: string;
  message: string | null;
};

let resendClient: Resend | null = null;

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

function getEmailSetup() {
  const resend = getResendClient();
  const from = getFromEmail();

  if (!resend || !from) {
    return null;
  }

  return { resend, from };
}

function logEmailFailure(context: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown email error";
  console.error(`${context}: ${message}`);
}

export async function sendFamilyEnquiryConfirmation(
  input: FamilyConfirmationInput,
) {
  if (!input.family_email) {
    return false;
  }

  const setup = getEmailSetup();

  if (!setup) {
    return false;
  }

  try {
    await setup.resend.emails.send({
      from: setup.from,
      to: input.family_email,
      subject: "Your CareConnect India enquiry was submitted",
      text: [
        `Hi ${input.family_name},`,
        "",
        "Thank you for submitting your CareConnect India enquiry.",
        `Your enquiry for ${input.provider_name} has been received.`,
        `Service needed: ${input.service_needed}.`,
        "",
        "The provider will contact you directly using the contact details you shared.",
        "",
        "CareConnect India",
      ].join("\n"),
    });

    return true;
  } catch (error) {
    logEmailFailure("Family confirmation email failed", error);
    return false;
  }
}

export async function sendProviderLeadEmail(input: ProviderLeadEmailInput) {
  if (!input.lead_email) {
    return false;
  }

  const setup = getEmailSetup();

  if (!setup) {
    return false;
  }

  try {
    await setup.resend.emails.send({
      from: setup.from,
      to: input.lead_email,
      subject: "New CareConnect India enquiry",
      text: [
        `New CareConnect India enquiry for ${input.provider_name}`,
        "",
        `Family name: ${input.family_name}`,
        `Phone: ${input.family_phone}`,
        `Email: ${input.family_email ?? "Not provided"}`,
        `Service needed: ${input.service_needed}`,
        "",
        "Message:",
        input.message ?? "No message provided.",
      ].join("\n"),
    });

    return true;
  } catch (error) {
    logEmailFailure("Provider lead email failed", error);
    return false;
  }
}
