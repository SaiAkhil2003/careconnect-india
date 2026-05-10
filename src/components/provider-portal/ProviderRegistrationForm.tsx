"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  LANGUAGES,
  PRICING_RANGES,
  SERVICE_TYPES,
  STAFF_COUNT_RANGES,
  VIZAG_AREAS,
} from "@/lib/constants";
import type { Provider } from "@/lib/types";
import { MultiSelectField } from "@/components/provider-portal/MultiSelectField";

type FormState = {
  provider_name: string;
  service_types: string[];
  description: string;
  areas_covered: string[];
  languages_spoken: string[];
  phone: string;
  email: string;
  website_url: string;
  address_line: string;
  pricing_range: string;
  established_year: string;
  staff_count_range: string;
  lead_email: string;
  lead_whatsapp: string;
};

const initialFormState: FormState = {
  provider_name: "",
  service_types: [],
  description: "",
  areas_covered: [],
  languages_spoken: [],
  phone: "",
  email: "",
  website_url: "",
  address_line: "",
  pricing_range: "",
  established_year: "",
  staff_count_range: "",
  lead_email: "",
  lead_whatsapp: "",
};

export function ProviderRegistrationForm() {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [createdProvider, setCreatedProvider] = useState<Provider | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function updateField(field: keyof FormState, value: string | string[]) {
    setFormState((currentFormState) => ({
      ...currentFormState,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    if (!formState.email.trim() && !formState.lead_email.trim()) {
      setErrorMessage("Lead email is required when email is empty.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/provider/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formState,
          established_year: formState.established_year || null,
          pricing_range: formState.pricing_range || null,
          staff_count_range: formState.staff_count_range || null,
        }),
      });
      const result = (await response.json()) as {
        success: boolean;
        data?: { provider: Provider };
        error?: string;
      };

      if (!response.ok || !result.success || !result.data?.provider) {
        throw new Error(result.error ?? "Unable to submit provider profile.");
      }

      setCreatedProvider(result.data.provider);
      setFormState(initialFormState);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit provider profile.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (createdProvider) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold text-neutral-950">
          Provider profile submitted successfully.
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-700">
          It will become public after admin approval. Your profile is submitted
          on the Free plan. You can upgrade to Standard or Premium from Billing
          after registration.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn-primary" href="/dashboard" prefetch={false}>
            Go to dashboard
          </Link>
          <Link
            className="btn-secondary"
            href="/dashboard/billing"
            prefetch={false}
          >
            Manage billing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="card space-y-5" onSubmit={handleSubmit}>
      {errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {errorMessage}
        </div>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-neutral-800">
          Provider name *
        </span>
        <input
          className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
          onChange={(event) => updateField("provider_name", event.target.value)}
          required
          type="text"
          value={formState.provider_name}
        />
      </label>

      <MultiSelectField
        label="Service types"
        name="service_types"
        onChange={(values) => updateField("service_types", values)}
        options={SERVICE_TYPES}
        required
        selectedValues={formState.service_types}
      />

      <label className="block">
        <span className="text-sm font-medium text-neutral-800">
          Description
        </span>
        <textarea
          className="mt-2 min-h-28 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
          onChange={(event) => updateField("description", event.target.value)}
          value={formState.description}
        />
      </label>

      <MultiSelectField
        label="Areas covered"
        name="areas_covered"
        onChange={(values) => updateField("areas_covered", values)}
        options={VIZAG_AREAS}
        required
        selectedValues={formState.areas_covered}
      />

      <MultiSelectField
        label="Languages spoken"
        name="languages_spoken"
        onChange={(values) => updateField("languages_spoken", values)}
        options={LANGUAGES}
        required
        selectedValues={formState.languages_spoken}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-neutral-800">Phone *</span>
          <input
            className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
            onChange={(event) => updateField("phone", event.target.value)}
            required
            type="tel"
            value={formState.phone}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-neutral-800">Email</span>
          <input
            className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
            onChange={(event) => updateField("email", event.target.value)}
            type="email"
            value={formState.email}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-neutral-800">
            Lead email
          </span>
          <input
            className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
            onChange={(event) => updateField("lead_email", event.target.value)}
            type="email"
            value={formState.lead_email}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-neutral-800">
            Lead WhatsApp
          </span>
          <input
            className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
            onChange={(event) => updateField("lead_whatsapp", event.target.value)}
            type="tel"
            value={formState.lead_whatsapp}
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-neutral-800">Website URL</span>
        <input
          className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
          onChange={(event) => updateField("website_url", event.target.value)}
          type="url"
          value={formState.website_url}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-800">Address</span>
        <input
          className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
          onChange={(event) => updateField("address_line", event.target.value)}
          type="text"
          value={formState.address_line}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="text-sm font-medium text-neutral-800">
            Pricing range
          </span>
          <select
            className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
            onChange={(event) => updateField("pricing_range", event.target.value)}
            value={formState.pricing_range}
          >
            <option value="">Not listed</option>
            {PRICING_RANGES.map((pricingRange) => (
              <option key={pricingRange.value} value={pricingRange.value}>
                {pricingRange.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-neutral-800">
            Established year
          </span>
          <input
            className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
            onChange={(event) =>
              updateField("established_year", event.target.value)
            }
            type="number"
            value={formState.established_year}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-neutral-800">
            Staff count
          </span>
          <select
            className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
            onChange={(event) =>
              updateField("staff_count_range", event.target.value)
            }
            value={formState.staff_count_range}
          >
            <option value="">Not listed</option>
            {STAFF_COUNT_RANGES.map((staffCountRange) => (
              <option key={staffCountRange.value} value={staffCountRange.value}>
                {staffCountRange.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button className="btn-primary w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Submitting..." : "Submit provider profile"}
      </button>
    </form>
  );
}
