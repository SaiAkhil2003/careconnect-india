import "server-only";

import Stripe from "stripe";

export const STRIPE_BILLING_SETUP_ERROR =
  "Stripe billing is not configured yet.";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export function assertStripeClient() {
  const stripe = getStripeClient();

  if (!stripe) {
    throw new Error(STRIPE_BILLING_SETUP_ERROR);
  }

  return stripe;
}
