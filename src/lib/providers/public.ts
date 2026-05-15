import type { Provider, PublicProvider } from "@/lib/types";

export const PUBLIC_PROVIDER_COLUMNS = [
  "id",
  "provider_name",
  "slug",
  "service_types",
  "description",
  "areas_covered",
  "languages_spoken",
  "phone",
  "email",
  "website_url",
  "address_line",
  "city",
  "pricing_range",
  "established_year",
  "staff_count_range",
  "is_verified",
  "listing_tier",
  "logo_url",
].join(", ");

export const PRIVATE_PROVIDER_FIELDS = [
  "clerk_user_id",
  "stripe_customer_id",
  "stripe_subscription_id",
  "lead_email",
  "lead_whatsapp",
  "is_active",
  "created_at",
  "updated_at",
] as const;

export function toPublicProvider(provider: Provider): PublicProvider {
  const publicProvider = { ...provider } as Partial<Provider>;

  for (const field of PRIVATE_PROVIDER_FIELDS) {
    delete publicProvider[field];
  }

  return publicProvider as PublicProvider;
}

export function toPublicProviders(providers: Provider[]) {
  return providers.map(toPublicProvider);
}
