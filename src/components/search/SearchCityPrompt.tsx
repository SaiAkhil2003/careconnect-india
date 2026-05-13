"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicCity } from "@/lib/constants";
import { CitySelector } from "@/components/search/CitySelector";

type SearchCityPromptProps = {
  buttonLabel?: string;
};

export function SearchCityPrompt({
  buttonLabel = "View providers",
}: SearchCityPromptProps) {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState<PublicCity | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!selectedCity) {
      setErrorMessage("Please select your city first.");
      return;
    }

    router.push(`/search?city=${selectedCity.slug}`);
  }

  return (
    <form className="mt-5 max-w-xl space-y-4" onSubmit={handleSubmit}>
      <CitySelector
        label="Select city"
        onCityChange={setSelectedCity}
      />
      {errorMessage ? (
        <p className="text-sm font-medium text-red-700">{errorMessage}</p>
      ) : null}
      <button className="btn-primary w-full sm:w-auto" type="submit">
        {buttonLabel}
      </button>
    </form>
  );
}
