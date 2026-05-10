import type {
  ListingTier,
  PricingRange,
  ServiceType,
  StaffCountRange,
} from "@/lib/types";

export const SERVICE_TYPES = [
  { value: "home_care", label: "Home Care" },
  { value: "senior_living", label: "Senior Living" },
  { value: "day_care", label: "Day Care" },
  { value: "physio", label: "Physiotherapy" },
  { value: "geriatric_doctor", label: "Geriatric Doctor" },
  { value: "companion", label: "Companion Care" },
  { value: "dementia_care", label: "Dementia Care" },
] as const satisfies ReadonlyArray<{ value: ServiceType; label: string }>;

export const PRICING_RANGES = [
  { value: "budget", label: "Budget" },
  { value: "mid", label: "Mid Range" },
  { value: "premium", label: "Premium" },
] as const satisfies ReadonlyArray<{ value: PricingRange; label: string }>;

export const STAFF_COUNT_RANGES = [
  { value: "1-5", label: "1-5 staff" },
  { value: "6-20", label: "6-20 staff" },
  { value: "21-50", label: "21-50 staff" },
  { value: "50+", label: "50+ staff" },
] as const satisfies ReadonlyArray<{ value: StaffCountRange; label: string }>;

export const LANGUAGES = [
  "Telugu",
  "English",
  "Hindi",
  "Tamil",
  "Odia",
] as const;

export const VIZAG_AREAS = [
  "MVP Colony",
  "Gajuwaka",
  "Dwaraka Nagar",
  "Madhurawada",
  "Seethammadhara",
  "Akkayyapalem",
  "Siripuram",
  "Rushikonda",
  "Pendurthi",
  "NAD",
  "Bheemili",
  "Anakapalle",
] as const;

export const LISTING_TIERS = [
  { value: "free", label: "Free" },
  { value: "standard", label: "Standard" },
  { value: "premium", label: "Premium" },
] as const satisfies ReadonlyArray<{ value: ListingTier; label: string }>;

export const SERVICE_TYPE_VALUES = SERVICE_TYPES.map(({ value }) => value);
export const LISTING_TIER_VALUES = LISTING_TIERS.map(({ value }) => value);
