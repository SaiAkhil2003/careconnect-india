"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { SERVICE_TYPES, VIZAG_AREAS } from "@/lib/constants";

export function HomeSearchForm() {
  const router = useRouter();
  const [serviceType, setServiceType] = useState("");
  const [area, setArea] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const searchParams = new URLSearchParams();

    if (serviceType) {
      searchParams.set("service_type", serviceType);
    }

    if (area) {
      searchParams.set("area", area);
    }

    const queryString = searchParams.toString();
    router.push(queryString ? `/search?${queryString}` : "/search");
  }

  return (
    <form
      className="mt-6 grid gap-4 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm sm:p-4 md:mt-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
      onSubmit={handleSubmit}
    >
      <label className="block">
        <span className="text-sm font-medium text-neutral-800">
          Service type
        </span>
        <select
          className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
          onChange={(event) => setServiceType(event.target.value)}
          value={serviceType}
        >
          <option value="">Any service</option>
          {SERVICE_TYPES.map((service) => (
            <option key={service.value} value={service.value}>
              {service.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-800">Area</span>
        <select
          className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
          onChange={(event) => setArea(event.target.value)}
          value={area}
        >
          <option value="">Any Vizag area</option>
          {VIZAG_AREAS.map((vizagArea) => (
            <option key={vizagArea} value={vizagArea}>
              {vizagArea}
            </option>
          ))}
        </select>
      </label>

      <button className="btn-primary w-full md:mt-7 md:w-auto" type="submit">
        Search
      </button>
    </form>
  );
}
