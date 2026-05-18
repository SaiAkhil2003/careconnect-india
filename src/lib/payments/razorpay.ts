import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const RAZORPAY_BILLING_SETUP_ERROR =
  "Razorpay billing is not configured.";

const RAZORPAY_API_BASE_URL = "https://api.razorpay.com/v1";
const RAZORPAY_SUBSCRIPTION_TOTAL_COUNT = 12;

type RazorpayConfig = {
  keyId: string;
  keySecret: string;
};

export type RazorpaySubscription = {
  id: string;
  entity: "subscription";
  plan_id: string;
  status: string;
  customer_id?: string | null;
  notes?: Record<string, string> | [];
};

export type RazorpaySubscriptionInput = {
  planId: string;
  notes: Record<string, string>;
};

function getRazorpayConfig(): RazorpayConfig | null {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    return null;
  }

  return { keyId, keySecret };
}

export function getRazorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID?.trim() || null;
}

export async function createRazorpaySubscription({
  planId,
  notes,
}: RazorpaySubscriptionInput) {
  const config = getRazorpayConfig();

  if (!config) {
    throw new Error(RAZORPAY_BILLING_SETUP_ERROR);
  }

  const credentials = Buffer.from(
    `${config.keyId}:${config.keySecret}`,
  ).toString("base64");

  const response = await fetch(`${RAZORPAY_API_BASE_URL}/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan_id: planId,
      total_count: RAZORPAY_SUBSCRIPTION_TOTAL_COUNT,
      quantity: 1,
      customer_notify: true,
      notes,
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | RazorpaySubscription
    | null;

  if (!response.ok || !data || typeof data.id !== "string") {
    throw new Error("Unable to create Razorpay subscription.");
  }

  return data;
}

export function verifyRazorpayWebhookSignature({
  rawBody,
  signature,
  webhookSecret,
}: {
  rawBody: string;
  signature: string;
  webhookSecret: string;
}) {
  const expectedSignature = createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const received = Buffer.from(signature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");

  if (received.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(received, expected);
}
