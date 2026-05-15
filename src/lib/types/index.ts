export type ListingTier = "free" | "standard" | "premium";

export type PricingRange = "budget" | "mid" | "premium";

export type ServiceType =
  | "home_care"
  | "senior_living"
  | "day_care"
  | "physio"
  | "geriatric_doctor"
  | "companion"
  | "dementia_care";

export type StaffCountRange = "1-5" | "6-20" | "21-50" | "50+";

export type City = {
  id: string;
  name: string;
  slug: string;
  state: string | null;
  is_active: boolean | null;
  provider_count: number | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Provider = {
  id: string;
  clerk_user_id: string | null;
  provider_name: string;
  slug: string;
  service_types: ServiceType[];
  description: string | null;
  areas_covered: string[];
  languages_spoken: string[];
  phone: string;
  email: string | null;
  website_url: string | null;
  address_line: string | null;
  city: string | null;
  pricing_range: PricingRange | null;
  established_year: number | null;
  staff_count_range: StaffCountRange | null;
  is_verified: boolean | null;
  listing_tier: ListingTier | null;
  is_active: boolean | null;
  logo_url: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  lead_email: string | null;
  lead_whatsapp: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type PublicProvider = Omit<
  Provider,
  | "clerk_user_id"
  | "stripe_customer_id"
  | "stripe_subscription_id"
  | "lead_email"
  | "lead_whatsapp"
  | "is_active"
  | "created_at"
  | "updated_at"
>;

export type Enquiry = {
  id: string;
  provider_id: string | null;
  family_name: string;
  family_phone: string;
  family_email: string | null;
  message: string | null;
  service_needed: string | null;
  is_delivered: boolean | null;
  delivery_method: "email" | "whatsapp" | "both" | null;
  created_at: string | null;
};

export type ProviderAnalytics = {
  id: string;
  provider_id: string | null;
  date: string;
  profile_views: number | null;
  enquiry_count: number | null;
  created_at: string | null;
};

export type AnalyticsMetric = "profile_views" | "enquiry_count";
