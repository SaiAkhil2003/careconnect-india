"use client";

import { ChangeEvent, useEffect, useId, useMemo, useState } from "react";
import { LOCATION_SUGGESTIONS } from "@/lib/constants";
import type { LocationSuggestion } from "@/lib/constants";

type LocationSearchInputProps = {
  id?: string;
  initialValue?: string;
  label?: string;
  name?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
};

const maxVisibleSuggestions = 8;

function matchesSuggestion(suggestion: LocationSuggestion, query: string) {
  const searchableValues = [
    suggestion.label,
    suggestion.value,
    suggestion.state,
    suggestion.city,
    suggestion.area,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableValues.includes(query);
}

function getSuggestionTypeLabel(type: LocationSuggestion["type"]) {
  if (type === "state") {
    return "State";
  }

  if (type === "city") {
    return "City";
  }

  return "Locality";
}

export function LocationSearchInput({
  id,
  initialValue = "",
  label = "Search location",
  name = "location",
  onValueChange,
  placeholder = "Search city or locality across India",
}: LocationSearchInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const suggestionsId = `${inputId}-suggestions`;
  const [inputValue, setInputValue] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const normalizedQuery = inputValue.trim().toLowerCase();

  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  const filteredSuggestions = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return LOCATION_SUGGESTIONS.filter((suggestion) =>
      matchesSuggestion(suggestion, normalizedQuery),
    ).slice(0, maxVisibleSuggestions);
  }, [normalizedQuery]);

  function updateValue(value: string) {
    setInputValue(value);
    onValueChange?.(value);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    updateValue(event.target.value);
    setIsOpen(true);
  }

  function selectSuggestion(suggestion: LocationSuggestion) {
    updateValue(suggestion.value);
    setIsOpen(false);
  }

  return (
    <label className="relative block">
      <span className="text-sm font-medium text-neutral-800">{label}</span>
      <input
        aria-autocomplete="list"
        aria-controls={suggestionsId}
        aria-expanded={isOpen && filteredSuggestions.length > 0}
        autoComplete="off"
        className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
        id={inputId}
        name={name}
        onBlur={() => setIsOpen(false)}
        onChange={handleChange}
        onFocus={() => setIsOpen(Boolean(normalizedQuery))}
        placeholder={placeholder}
        role="combobox"
        type="search"
        value={inputValue}
      />

      {isOpen && filteredSuggestions.length > 0 ? (
        <ul
          className="absolute left-0 right-0 z-20 mt-2 max-h-64 overflow-y-auto rounded-md border border-neutral-200 bg-white py-1 shadow-lg"
          id={suggestionsId}
        >
          {filteredSuggestions.map((suggestion) => (
            <li key={`${suggestion.type}-${suggestion.label}`}>
              <button
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-neutral-800 hover:bg-primary-light focus:bg-primary-light focus:outline-none"
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectSuggestion(suggestion);
                }}
                type="button"
              >
                <span className="min-w-0 truncate">{suggestion.label}</span>
                <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                  {getSuggestionTypeLabel(suggestion.type)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </label>
  );
}
