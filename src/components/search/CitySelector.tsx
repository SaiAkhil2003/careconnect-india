"use client";

import { ChangeEvent, useEffect, useId, useMemo, useState } from "react";
import {
  formatCityLabel,
  normalizeCityLookup,
  resolveCityFromList,
} from "@/lib/constants";
import type { PublicCity } from "@/lib/constants";

type CitySelectorProps = {
  autoDetectLabel?: string;
  initialCitySlug?: string;
  label?: string;
  onCitiesLoaded?: (cities: PublicCity[]) => void;
  onCityChange: (city: PublicCity | null) => void;
  onCityQueryChange?: (query: string) => void;
  onSearchAnotherCity?: (query: string) => void;
  showAutoDetect?: boolean;
};

type CitiesApiResponse =
  | {
      success: true;
      data: {
        cities: PublicCity[];
        message?: string;
      };
    }
  | {
      success: false;
      error: string;
    };

const maxVisibleSuggestions = 8;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(
  firstLatitude: number,
  firstLongitude: number,
  secondLatitude: number,
  secondLongitude: number,
) {
  const earthRadiusKm = 6371;
  const latitudeDistance = toRadians(secondLatitude - firstLatitude);
  const longitudeDistance = toRadians(secondLongitude - firstLongitude);
  const firstLatitudeRad = toRadians(firstLatitude);
  const secondLatitudeRad = toRadians(secondLatitude);

  const haversineValue =
    Math.sin(latitudeDistance / 2) * Math.sin(latitudeDistance / 2) +
    Math.sin(longitudeDistance / 2) *
      Math.sin(longitudeDistance / 2) *
      Math.cos(firstLatitudeRad) *
      Math.cos(secondLatitudeRad);

  return (
    earthRadiusKm *
    2 *
    Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue))
  );
}

function findNearestCity(
  latitude: number,
  longitude: number,
  cities: PublicCity[],
) {
  const citiesWithCoordinates = cities.filter(
    (city) => city.latitude !== null && city.longitude !== null,
  );

  if (!citiesWithCoordinates.length) {
    return null;
  }

  return citiesWithCoordinates.reduce((nearestCity, city) => {
    if (!nearestCity) {
      return city;
    }

    const nearestDistance = getDistanceKm(
      latitude,
      longitude,
      Number(nearestCity.latitude),
      Number(nearestCity.longitude),
    );
    const cityDistance = getDistanceKm(
      latitude,
      longitude,
      Number(city.latitude),
      Number(city.longitude),
    );

    return cityDistance < nearestDistance ? city : nearestCity;
  }, null as PublicCity | null);
}

export function CitySelector({
  autoDetectLabel = "Auto-detect city",
  initialCitySlug = "",
  label = "City",
  onCitiesLoaded,
  onCityChange,
  onCityQueryChange,
  onSearchAnotherCity,
  showAutoDetect = false,
}: CitySelectorProps) {
  const generatedId = useId();
  const inputId = `${generatedId}-city`;
  const suggestionsId = `${inputId}-suggestions`;
  const [cities, setCities] = useState<PublicCity[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedCity, setSelectedCity] = useState<PublicCity | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const trimmedQuery = inputValue.trim();
  const normalizedQuery = normalizeCityLookup(trimmedQuery);

  useEffect(() => {
    let isMounted = true;

    async function loadCities() {
      setIsLoadingCities(true);
      setStatusMessage("");

      try {
        const response = await fetch("/api/cities", { cache: "no-store" });
        const result = (await response.json()) as CitiesApiResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.success ? "Unable to load cities." : result.error,
          );
        }

        if (!isMounted) {
          return;
        }

        setCities(result.data.cities);
        onCitiesLoaded?.(result.data.cities);

        if (result.data.cities.length === 0) {
          setStatusMessage(
            "City setup is pending. Please contact CareConnect India.",
          );
        } else if (result.data.message) {
          setStatusMessage(result.data.message);
        }
      } catch {
        if (!isMounted) {
          return;
        }

        setCities([]);
        onCitiesLoaded?.([]);
        setStatusMessage(
          "City setup is pending. Please contact CareConnect India.",
        );
      } finally {
        if (isMounted) {
          setIsLoadingCities(false);
        }
      }
    }

    loadCities();

    return () => {
      isMounted = false;
    };
  }, [onCitiesLoaded]);

  useEffect(() => {
    if (!initialCitySlug || !cities.length) {
      return;
    }

    const initialCity = resolveCityFromList(initialCitySlug, cities);

    if (!initialCity) {
      return;
    }

    setSelectedCity(initialCity);
    setInputValue(formatCityLabel(initialCity));
    onCityQueryChange?.(formatCityLabel(initialCity));
    onCityChange(initialCity);
  }, [cities, initialCitySlug, onCityChange, onCityQueryChange]);

  const filteredCities = useMemo(() => {
    if (!normalizedQuery) {
      return cities.slice(0, maxVisibleSuggestions);
    }

    return cities
      .filter((city) => {
        const searchableValues = [city.name, city.slug, city.state]
          .filter((value): value is string => Boolean(value))
          .map((value) => value.toLowerCase());

        return searchableValues.some(
          (value) =>
            value.includes(trimmedQuery.toLowerCase()) ||
            normalizeCityLookup(value).includes(normalizedQuery),
        );
      })
      .slice(0, maxVisibleSuggestions);
  }, [cities, normalizedQuery, trimmedQuery]);

  function selectCity(city: PublicCity) {
    const cityLabel = formatCityLabel(city);

    setSelectedCity(city);
    setInputValue(cityLabel);
    setIsOpen(false);
    setStatusMessage("");
    onCityQueryChange?.(cityLabel);
    onCityChange(city);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;

    setInputValue(nextValue);
    setSelectedCity(null);
    setIsOpen(true);
    onCityQueryChange?.(nextValue);
    onCityChange(null);
  }

  function handleSearchAnotherCity() {
    if (!trimmedQuery) {
      return;
    }

    setIsOpen(false);
    onSearchAnotherCity?.(trimmedQuery);
  }

  function handleAutoDetect() {
    if (!navigator.geolocation || !cities.length) {
      setStatusMessage(
        "Auto-detect is not available yet. Please select your city manually.",
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearestCity = findNearestCity(
          position.coords.latitude,
          position.coords.longitude,
          cities,
        );

        if (!nearestCity) {
          setStatusMessage(
            "Auto-detect is not available yet. Please select your city manually.",
          );
          return;
        }

        selectCity(nearestCity);
      },
      () => {
        setStatusMessage(
          "Auto-detect is not available yet. Please select your city manually.",
        );
      },
      { timeout: 8000 },
    );
  }

  return (
    <div>
      <label className="relative block">
        <span className="text-sm font-medium text-neutral-800">{label}</span>
        <input
          aria-autocomplete="list"
          aria-controls={suggestionsId}
          aria-expanded={isOpen && filteredCities.length > 0}
          autoComplete="off"
          className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
          id={inputId}
          onBlur={() => setIsOpen(false)}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={
            isLoadingCities ? "Loading active cities..." : "Search your city"
          }
          role="combobox"
          type="search"
          value={inputValue}
        />

        {isOpen && filteredCities.length > 0 ? (
          <ul
            className="absolute left-0 right-0 z-20 mt-2 max-h-64 overflow-y-auto rounded-md border border-neutral-200 bg-white py-1 shadow-lg"
            id={suggestionsId}
          >
            {filteredCities.map((city) => (
              <li key={city.slug}>
                <button
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-neutral-800 hover:bg-primary-light focus:bg-primary-light focus:outline-none"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectCity(city);
                  }}
                  type="button"
                >
                  <span className="min-w-0 truncate">
                    {formatCityLabel(city)}
                  </span>
                  <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                    {city.provider_count ?? 0} providers
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {isOpen &&
        trimmedQuery &&
        !filteredCities.length &&
        !isLoadingCities ? (
          <div className="absolute left-0 right-0 z-20 mt-2 rounded-md border border-neutral-200 bg-white p-3 shadow-lg">
            <p className="text-sm leading-5 text-neutral-700">
              CareConnect is not active in this city yet.
            </p>
            {onSearchAnotherCity ? (
              <button
                className="mt-2 text-sm font-semibold text-primary hover:text-primary-dark"
                onMouseDown={(event) => {
                  event.preventDefault();
                  handleSearchAnotherCity();
                }}
                type="button"
              >
                Search another city
              </button>
            ) : null}
          </div>
        ) : null}
      </label>

      <input name="city" type="hidden" value={selectedCity?.slug ?? ""} />

      {showAutoDetect ? (
        <button
          className="mt-3 text-sm font-semibold text-primary hover:text-primary-dark"
          onClick={handleAutoDetect}
          type="button"
        >
          {autoDetectLabel}
        </button>
      ) : null}

      {statusMessage ? (
        <p className="mt-2 text-xs leading-5 text-neutral-600">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
