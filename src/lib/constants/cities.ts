import { SUPPORTED_AREAS_BY_CITY } from "@/lib/constants/locations";
import type { City } from "@/lib/types";

export type PublicCity = Pick<
  City,
  "id" | "name" | "slug" | "state" | "provider_count" | "latitude" | "longitude"
>;

const cityAliases = {
  bangalore: "bengaluru",
  bengaluru: "bengaluru",
  mangaluru: "mangalore",
  mangalore: "mangalore",
  mysore: "mysuru",
  mysuru: "mysuru",
  vizag: "visakhapatnam",
  visakhapatnam: "visakhapatnam",
} as const;

export function createCitySlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeCityLookup(value: string) {
  const slug = createCitySlug(value);

  return cityAliases[slug as keyof typeof cityAliases] ?? slug;
}

export function resolveCityFromList(
  value: string | null | undefined,
  cities: PublicCity[],
) {
  if (!value?.trim()) {
    return null;
  }

  const normalizedValue = normalizeCityLookup(value);

  return (
    cities.find(
      (city) =>
        normalizeCityLookup(city.slug) === normalizedValue ||
        normalizeCityLookup(city.name) === normalizedValue,
    ) ?? null
  );
}

export function resolveCityFromArea(
  value: string | null | undefined,
  cities: PublicCity[],
) {
  if (!value?.trim()) {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();

  for (const city of cities) {
    const cityAreas = getAreasForCity(city.name);
    const hasArea = cityAreas.some(
      (area) => area.trim().toLowerCase() === normalizedValue,
    );

    if (hasArea) {
      return city;
    }
  }

  return null;
}

export function resolveCityFromLocationAlias(
  value: string | null | undefined,
  cities: PublicCity[],
) {
  return resolveCityFromList(value, cities) ?? resolveCityFromArea(value, cities);
}

export function getAreasForCity(cityName: string | null | undefined) {
  if (!cityName) {
    return [];
  }

  const cityKey = Object.keys(SUPPORTED_AREAS_BY_CITY).find(
    (key) => createCitySlug(key) === createCitySlug(cityName),
  ) as keyof typeof SUPPORTED_AREAS_BY_CITY | undefined;

  return cityKey ? [...SUPPORTED_AREAS_BY_CITY[cityKey]] : [];
}

export function formatCityLabel(city: PublicCity) {
  return city.state ? `${city.name}, ${city.state}` : city.name;
}
