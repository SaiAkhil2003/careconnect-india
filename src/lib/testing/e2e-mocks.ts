import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import type { NextRequest } from "next/server";
import type { PublicCity } from "../constants/cities";
import type {
  Enquiry,
  ListingTier,
  PricingRange,
  Provider,
  ProviderAnalytics,
  PublicProvider,
  ServiceType,
} from "../types";
import { toPublicProvider } from "../providers/public";
import { generateSlug } from "../utils/slug";

export const E2E_TEST_MODE_ENV = "E2E_TEST_MODE";
export const E2E_AUTH_COOKIE = "careconnect_e2e_auth";
export const E2E_AUTH_PROVIDER_VALUE = "provider";
export const E2E_PROVIDER_STATE_COOKIE = "careconnect_e2e_provider_state";
export const E2E_PROVIDER_TIER_COOKIE = "careconnect_e2e_listing_tier";
export const E2E_UNREGISTERED_PROVIDER_VALUE = "unregistered";

export const E2E_VISAKHAPATNAM_CITY: PublicCity = {
  id: "10000000-0000-4000-8000-000000000001",
  name: "Visakhapatnam",
  slug: "visakhapatnam",
  state: "Andhra Pradesh",
  provider_count: 2,
  latitude: 17.6868,
  longitude: 83.2185,
};

export const E2E_BENGALURU_CITY: PublicCity = {
  id: "10000000-0000-4000-8000-000000000002",
  name: "Bengaluru",
  slug: "bengaluru",
  state: "Karnataka",
  provider_count: 1,
  latitude: 12.9716,
  longitude: 77.5946,
};

export const E2E_INACTIVE_CITY: PublicCity = {
  id: "10000000-0000-4000-8000-000000000003",
  name: "Hyderabad",
  slug: "hyderabad",
  state: "Telangana",
  provider_count: 0,
  latitude: 17.385,
  longitude: 78.4867,
};

export const E2E_MOCK_CITIES: PublicCity[] = [
  E2E_VISAKHAPATNAM_CITY,
  E2E_BENGALURU_CITY,
];

export const E2E_PROVIDER_ID = "20000000-0000-4000-8000-000000000001";
export const E2E_AUTH_PROVIDER_ID = "20000000-0000-4000-8000-000000000010";
export const E2E_OTHER_PROVIDER_ID = "20000000-0000-4000-8000-000000000011";

const E2E_INACTIVE_PROVIDER_ID = "20000000-0000-4000-8000-000000000004";

type E2eSearchProvider = PublicProvider &
  Pick<Provider, "is_active" | "created_at" | "updated_at">;

export const E2E_MOCK_PROVIDERS: E2eSearchProvider[] = [
  {
    id: E2E_PROVIDER_ID,
    provider_name: "Seaside Elder Care",
    slug: "seaside-elder-care",
    service_types: ["home_care", "physio"],
    description:
      "Verified home care and physiotherapy support for older adults in Visakhapatnam.",
    areas_covered: ["MVP Colony", "Beach Road"],
    languages_spoken: ["English", "Telugu"],
    phone: "+91 98765 43210",
    email: "care@seaside.example",
    website_url: "https://seaside.example",
    address_line: "10 Beach Road, MVP Colony",
    city: "Visakhapatnam",
    pricing_range: "mid",
    established_year: 2018,
    staff_count_range: "21-50",
    is_verified: true,
    listing_tier: "premium",
    is_active: true,
    logo_url: null,
    created_at: "2026-05-01T09:00:00.000Z",
    updated_at: "2026-05-01T09:00:00.000Z",
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    provider_name: "Vizag Companion Care",
    slug: "vizag-companion-care",
    service_types: ["companion", "dementia_care"],
    description: "Companion care and dementia support in south Vizag.",
    areas_covered: ["Gajuwaka", "Dwaraka Nagar"],
    languages_spoken: ["Hindi", "Telugu"],
    phone: "+91 91234 56780",
    email: "hello@vizagcompanion.example",
    website_url: null,
    address_line: "22 Gajuwaka Main Road",
    city: "Visakhapatnam",
    pricing_range: "budget",
    established_year: 2021,
    staff_count_range: "6-20",
    is_verified: false,
    listing_tier: "standard",
    is_active: true,
    logo_url: null,
    created_at: "2026-04-20T09:00:00.000Z",
    updated_at: "2026-04-20T09:00:00.000Z",
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    provider_name: "Bengaluru Senior Living",
    slug: "bengaluru-senior-living",
    service_types: ["senior_living"],
    description: "Senior living residences in Bengaluru.",
    areas_covered: ["Indiranagar", "Whitefield"],
    languages_spoken: ["English", "Kannada"],
    phone: "+91 90000 11111",
    email: "info@bengaluruseniors.example",
    website_url: null,
    address_line: "5 Indiranagar 100 Feet Road",
    city: "Bengaluru",
    pricing_range: "premium",
    established_year: 2015,
    staff_count_range: "50+",
    is_verified: true,
    listing_tier: "free",
    is_active: true,
    logo_url: null,
    created_at: "2026-03-15T09:00:00.000Z",
    updated_at: "2026-03-15T09:00:00.000Z",
  },
  {
    id: E2E_INACTIVE_PROVIDER_ID,
    provider_name: "Inactive Vizag Care",
    slug: "inactive-vizag-care",
    service_types: ["home_care"],
    description: "This inactive provider must never appear in public results.",
    areas_covered: ["MVP Colony"],
    languages_spoken: ["English"],
    phone: "+91 90000 22222",
    email: "inactive@example.com",
    website_url: null,
    address_line: null,
    city: "Visakhapatnam",
    pricing_range: "budget",
    established_year: null,
    staff_count_range: null,
    is_verified: false,
    listing_tier: "premium",
    is_active: false,
    logo_url: null,
    created_at: "2026-02-01T09:00:00.000Z",
    updated_at: "2026-02-01T09:00:00.000Z",
  },
];

const defaultAuthenticatedProvider: Provider = {
  id: E2E_AUTH_PROVIDER_ID,
  clerk_user_id: "clerk_e2e_provider",
  provider_name: "CareConnect E2E Provider",
  slug: "careconnect-e2e-provider",
  service_types: ["home_care", "physio"],
  description: "Local authenticated E2E provider fixture.",
  areas_covered: ["MVP Colony", "Dwaraka Nagar"],
  languages_spoken: ["English", "Telugu"],
  phone: "+91 95555 00001",
  email: "provider-e2e@example.com",
  website_url: "https://provider-e2e.example",
  address_line: "1 E2E Road, MVP Colony",
  city: "Visakhapatnam",
  pricing_range: "mid",
  established_year: 2020,
  staff_count_range: "6-20",
  is_verified: true,
  listing_tier: "premium",
  is_active: true,
  logo_url: null,
  stripe_customer_id: "cus_e2e_provider",
  stripe_subscription_id: "sub_e2e_provider",
  lead_email: "leads-e2e@example.com",
  lead_whatsapp: "+919555500001",
  created_at: "2026-05-01T08:00:00.000Z",
  updated_at: "2026-05-01T08:00:00.000Z",
};

const defaultLeads: Enquiry[] = [
  {
    id: "30000000-0000-4000-8000-000000000010",
    provider_id: E2E_AUTH_PROVIDER_ID,
    family_name: "Anita Rao",
    family_phone: "+91 98888 77777",
    family_email: "anita@example.com",
    message: "Need home care support for my father next week.",
    service_needed: "home_care",
    is_delivered: true,
    delivery_method: "email",
    created_at: "2026-05-15T09:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000011",
    provider_id: E2E_AUTH_PROVIDER_ID,
    family_name: "Rahul Menon",
    family_phone: "+91 97777 66666",
    family_email: null,
    message: "Physiotherapy consultation requested.",
    service_needed: "physio",
    is_delivered: false,
    delivery_method: "email",
    created_at: "2026-05-14T10:30:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000012",
    provider_id: E2E_OTHER_PROVIDER_ID,
    family_name: "Other Provider Family",
    family_phone: "+91 96666 55555",
    family_email: "other@example.com",
    message: "This lead belongs to another provider and must not be visible.",
    service_needed: "companion",
    is_delivered: false,
    delivery_method: "email",
    created_at: "2026-05-13T10:30:00.000Z",
  },
];

const defaultAnalyticsRows: ProviderAnalytics[] = [
  {
    id: "40000000-0000-4000-8000-000000000001",
    provider_id: E2E_AUTH_PROVIDER_ID,
    date: "2026-05-15",
    profile_views: 30,
    enquiry_count: 2,
    created_at: "2026-05-15T00:00:00.000Z",
  },
  {
    id: "40000000-0000-4000-8000-000000000002",
    provider_id: E2E_AUTH_PROVIDER_ID,
    date: "2026-05-14",
    profile_views: 12,
    enquiry_count: 1,
    created_at: "2026-05-14T00:00:00.000Z",
  },
];

type E2eProviderState = {
  provider: Provider;
  hasProfile: boolean;
};

const listingTiers = new Set<ListingTier>(["free", "standard", "premium"]);
const e2eProviderStatePath =
  process.env.CARECONNECT_E2E_STATE_FILE ??
  join(tmpdir(), "careconnect-india-e2e-provider-state.json");

const tierPriority = {
  free: 1,
  standard: 2,
  premium: 3,
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCity(value: string) {
  const slug = slugify(value);

  if (slug === "vizag") {
    return "visakhapatnam";
  }

  if (slug === "bangalore") {
    return "bengaluru";
  }

  return slug;
}

function getPositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function matchesText(value: string | null | undefined, expected: string) {
  return value?.trim().toLowerCase() === expected.trim().toLowerCase();
}

function includesText(values: string[] | null | undefined, expected: string) {
  return Boolean(values?.some((value) => matchesText(value, expected)));
}

function findMockCity(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const normalizedValue = normalizeCity(value);

  return (
    E2E_MOCK_CITIES.find(
      (city) =>
        normalizeCity(city.slug) === normalizedValue ||
        normalizeCity(city.name) === normalizedValue,
    ) ?? null
  );
}

function sortProviders(providers: E2eSearchProvider[]) {
  return [...providers].sort((firstProvider, secondProvider) => {
    const priorityDifference =
      tierPriority[secondProvider.listing_tier ?? "free"] -
      tierPriority[firstProvider.listing_tier ?? "free"];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    const verifiedDifference =
      Number(Boolean(secondProvider.is_verified)) -
      Number(Boolean(firstProvider.is_verified));

    if (verifiedDifference !== 0) {
      return verifiedDifference;
    }

    return firstProvider.provider_name.localeCompare(
      secondProvider.provider_name,
    );
  });
}

function requestCookie(request: NextRequest, name: string) {
  return request.cookies.get(name)?.value ?? "";
}

function cloneProvider(provider: Provider) {
  return {
    ...provider,
    service_types: [...provider.service_types],
    areas_covered: [...provider.areas_covered],
    languages_spoken: [...provider.languages_spoken],
  };
}

function defaultProviderState(options?: {
  hasProfile?: boolean;
  listingTier?: ListingTier;
}): E2eProviderState {
  return {
    provider: {
      ...cloneProvider(defaultAuthenticatedProvider),
      listing_tier:
        options?.listingTier ?? defaultAuthenticatedProvider.listing_tier,
    },
    hasProfile: options?.hasProfile ?? true,
  };
}

function isProviderState(value: unknown): value is E2eProviderState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const state = value as Partial<E2eProviderState>;

  return Boolean(
    state.provider &&
      typeof state.provider === "object" &&
      typeof state.provider.id === "string" &&
      typeof state.hasProfile === "boolean",
  );
}

function readE2eProviderState() {
  if (!existsSync(e2eProviderStatePath)) {
    return defaultProviderState();
  }

  try {
    const parsed = JSON.parse(readFileSync(e2eProviderStatePath, "utf8"));

    if (isProviderState(parsed)) {
      return {
        provider: cloneProvider(parsed.provider),
        hasProfile: parsed.hasProfile,
      };
    }
  } catch {
    return defaultProviderState();
  }

  return defaultProviderState();
}

function writeE2eProviderState(state: E2eProviderState) {
  mkdirSync(dirname(e2eProviderStatePath), { recursive: true });
  writeFileSync(e2eProviderStatePath, JSON.stringify(state), "utf8");
}

function getTierCookie(request: NextRequest) {
  const tier = requestCookie(request, E2E_PROVIDER_TIER_COOKIE);

  return listingTiers.has(tier as ListingTier)
    ? (tier as ListingTier)
    : undefined;
}

export function isE2eMockMode() {
  return (
    process.env[E2E_TEST_MODE_ENV] === "true" ||
    process.env.NODE_ENV === "test"
  );
}

export function isE2eAuthenticatedProvider(request: NextRequest) {
  return (
    isE2eMockMode() &&
    requestCookie(request, E2E_AUTH_COOKIE) === E2E_AUTH_PROVIDER_VALUE
  );
}

export function hasE2eProviderProfile(request: NextRequest) {
  return (
    readE2eProviderState().hasProfile &&
    requestCookie(request, E2E_PROVIDER_STATE_COOKIE) !==
      E2E_UNREGISTERED_PROVIDER_VALUE
  );
}

export function resetE2eProviderState(options?: {
  hasProfile?: boolean;
  listingTier?: ListingTier;
}) {
  writeE2eProviderState(defaultProviderState(options));
}

export function getE2eAuthenticatedProvider(request: NextRequest) {
  if (!isE2eAuthenticatedProvider(request)) {
    return { authenticated: false as const, provider: null };
  }

  if (!hasE2eProviderProfile(request)) {
    return { authenticated: true as const, provider: null };
  }

  const state = readE2eProviderState();
  const tier = getTierCookie(request);
  const provider = tier
    ? {
        ...state.provider,
        listing_tier: tier,
      }
    : state.provider;

  return { authenticated: true as const, provider };
}

export function registerE2eProvider(payload: Record<string, unknown>) {
  const providerName =
    typeof payload.provider_name === "string" && payload.provider_name.trim()
      ? payload.provider_name.trim()
      : "CareConnect Registered E2E Provider";
  const email =
    typeof payload.email === "string" && payload.email.trim()
      ? payload.email.trim()
      : null;

  const pricingRange: PricingRange | null =
    payload.pricing_range === "budget" ||
    payload.pricing_range === "mid" ||
    payload.pricing_range === "premium"
      ? payload.pricing_range
      : null;

  const provider: Provider = {
    ...defaultAuthenticatedProvider,
    provider_name: providerName,
    slug: generateSlug(providerName) || "careconnect-registered-e2e-provider",
    service_types: Array.isArray(payload.service_types)
      ? (payload.service_types.filter(
          (serviceType): serviceType is ServiceType =>
            typeof serviceType === "string",
        ) as ServiceType[])
      : defaultAuthenticatedProvider.service_types,
    areas_covered: Array.isArray(payload.areas_covered)
      ? payload.areas_covered.filter(
          (area): area is string => typeof area === "string",
        )
      : defaultAuthenticatedProvider.areas_covered,
    languages_spoken: Array.isArray(payload.languages_spoken)
      ? payload.languages_spoken.filter(
          (language): language is string => typeof language === "string",
        )
      : defaultAuthenticatedProvider.languages_spoken,
    phone:
      typeof payload.phone === "string" && payload.phone.trim()
        ? payload.phone.trim()
        : defaultAuthenticatedProvider.phone,
    email,
    lead_email:
      typeof payload.lead_email === "string" && payload.lead_email.trim()
        ? payload.lead_email.trim()
        : email,
    pricing_range: pricingRange,
    listing_tier: "free",
    is_active: false,
    is_verified: false,
  };
  writeE2eProviderState({ provider, hasProfile: true });

  return provider;
}

export function updateE2eAuthenticatedProvider(updates: Partial<Provider>) {
  const state = readE2eProviderState();
  const provider = {
    ...state.provider,
    ...updates,
    updated_at: "2026-05-15T10:00:00.000Z",
  };
  writeE2eProviderState({ ...state, provider });

  return provider;
}

export function updateE2eProviderTier(tier: ListingTier) {
  const state = readE2eProviderState();
  const provider = {
    ...state.provider,
    listing_tier: tier,
    stripe_subscription_id: tier === "free" ? null : "sub_e2e_provider",
    updated_at: "2026-05-15T10:00:00.000Z",
  };
  writeE2eProviderState({ ...state, provider });

  return provider;
}

export function getE2eProviderLeads(providerId: string) {
  return defaultLeads.filter((lead) => lead.provider_id === providerId);
}

export function getE2eProviderAnalytics() {
  const totalProfileViews = defaultAnalyticsRows.reduce(
    (total, row) => total + (row.profile_views ?? 0),
    0,
  );
  const totalEnquiries = defaultAnalyticsRows.reduce(
    (total, row) => total + (row.enquiry_count ?? 0),
    0,
  );

  return {
    total_profile_views: totalProfileViews,
    total_enquiries: totalEnquiries,
    daily_rows: defaultAnalyticsRows,
  };
}

export function getE2eCheckoutUrl(tier: ListingTier) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ??
    "http://127.0.0.1:3000";

  return `${appUrl}/dashboard/billing?success=true&e2e_tier=${tier}`;
}

export function getE2eMockProviderBySlug(slug: string) {
  const provider =
    E2E_MOCK_PROVIDERS.find(
      (mockProvider) => mockProvider.slug === slug && mockProvider.is_active,
    ) ?? null;

  return provider ? toPublicProvider(provider as Provider) : null;
}

export function getE2eMockProviderSearchResponse(searchParams: URLSearchParams) {
  const requestedCity = searchParams.get("city")?.trim();
  const location = searchParams.get("location")?.trim();
  const serviceType = searchParams.get("service_type")?.trim();
  const area = searchParams.get("area")?.trim();
  const language = searchParams.get("language")?.trim();
  const tier = searchParams.get("tier")?.trim();
  const verified = searchParams.get("verified") === "true";
  const page = getPositiveInteger(searchParams.get("page"), 1);
  const limit = Math.min(getPositiveInteger(searchParams.get("limit"), 10), 50);

  if (!requestedCity && !location) {
    return {
      providers: [],
      message: "City is required for provider search.",
      pagination: { page: 1, limit: 10, total: 0, total_pages: 0 },
    };
  }

  const selectedCity = findMockCity(requestedCity ?? location);

  if (!selectedCity) {
    return {
      providers: [],
      message: "This city is not active yet.",
      pagination: { page: 1, limit: 10, total: 0, total_pages: 0 },
    };
  }

  const filteredProviders = sortProviders(
    E2E_MOCK_PROVIDERS.filter((provider) => {
      if (!provider.is_active || !matchesText(provider.city, selectedCity.name)) {
        return false;
      }

      if (serviceType && !provider.service_types.includes(serviceType as ServiceType)) {
        return false;
      }

      if (area && !includesText(provider.areas_covered, area)) {
        return false;
      }

      if (language && !includesText(provider.languages_spoken, language)) {
        return false;
      }

      if (tier && provider.listing_tier !== tier) {
        return false;
      }

      if (verified && !provider.is_verified) {
        return false;
      }

      return true;
    }),
  );

  const from = (page - 1) * limit;
  const paginatedProviders = filteredProviders
    .slice(from, from + limit)
    .map((provider) => toPublicProvider(provider as Provider));

  return {
    providers: paginatedProviders,
    city: selectedCity,
    pagination: {
      page,
      limit,
      total: filteredProviders.length,
      total_pages: Math.ceil(filteredProviders.length / limit),
    },
  };
}

export function createE2eMockEnquiry(input: {
  provider_id: string;
  family_name: string;
  family_phone: string;
  family_email: string | null;
  message: string | null;
  service_needed: string;
}): Enquiry {
  return {
    id: "30000000-0000-4000-8000-000000000001",
    provider_id: input.provider_id,
    family_name: input.family_name,
    family_phone: input.family_phone,
    family_email: input.family_email,
    message: input.message,
    service_needed: input.service_needed,
    is_delivered: false,
    delivery_method: "email",
    created_at: "2026-05-15T09:00:00.000Z",
  };
}
