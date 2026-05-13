"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import {
  getAreasForCity,
  LANGUAGES,
  PRICING_RANGES,
  SERVICE_TYPES,
  STAFF_COUNT_RANGES,
} from "@/lib/constants";
import type { Provider } from "@/lib/types";
import { MultiSelectField } from "@/components/provider-portal/MultiSelectField";

type ProviderProfileFormProps = {
  provider: Provider;
};

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
  logo_url: string;
};

function getInitialFormState(provider: Provider): FormState {
  return {
    provider_name: provider.provider_name,
    service_types: provider.service_types,
    description: provider.description ?? "",
    areas_covered: provider.areas_covered,
    languages_spoken: provider.languages_spoken,
    phone: provider.phone,
    email: provider.email ?? "",
    website_url: provider.website_url ?? "",
    address_line: provider.address_line ?? "",
    pricing_range: provider.pricing_range ?? "",
    established_year: provider.established_year
      ? String(provider.established_year)
      : "",
    staff_count_range: provider.staff_count_range ?? "",
    lead_email: provider.lead_email ?? "",
    lead_whatsapp: provider.lead_whatsapp ?? "",
    logo_url: provider.logo_url ?? "",
  };
}

export function ProviderProfileForm({ provider }: ProviderProfileFormProps) {
  const [formState, setFormState] = useState<FormState>(
    getInitialFormState(provider),
  );
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [logoUploadMessage, setLogoUploadMessage] = useState("");
  const areaOptions = getAreasForCity(provider.city);

  function updateField(field: keyof FormState, value: string | string[]) {
    setFormState((currentFormState) => ({
      ...currentFormState,
      [field]: value,
    }));
  }

  function handleLogoFileChange(event: ChangeEvent<HTMLInputElement>) {
    setLogoFile(event.target.files?.[0] ?? null);
    setLogoUploadMessage("");
  }

  async function handleLogoUpload() {
    if (!logoFile) {
      setErrorMessage("Select a logo image to upload.");
      return;
    }

    setIsLogoUploading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setLogoUploadMessage("");

    try {
      const formData = new FormData();
      formData.append("file", logoFile);

      const response = await fetch("/api/provider/logo", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        success: boolean;
        data?: { logo_url: string };
        error?: string;
      };

      if (!response.ok || !result.success || !result.data?.logo_url) {
        throw new Error(result.error ?? "Unable to upload provider logo.");
      }

      updateField("logo_url", result.data.logo_url);
      setLogoFile(null);
      setLogoUploadMessage("Logo uploaded successfully.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to upload provider logo.",
      );
    } finally {
      setIsLogoUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/provider/me", {
        method: "PATCH",
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
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Unable to update profile.");
      }

      setSuccessMessage("Profile updated successfully.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update profile.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="card space-y-5" onSubmit={handleSubmit}>
      {successMessage ? (
        <div className="rounded-md border border-primary-light bg-primary-light p-4 text-sm font-medium text-primary-dark">
          {successMessage}
        </div>
      ) : null}

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
        options={areaOptions.length ? areaOptions : provider.areas_covered}
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

      <section className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
        <h2 className="text-sm font-semibold text-neutral-950">
          Upload provider logo
        </h2>
        <p className="mt-2 text-sm leading-6 text-neutral-700">
          Public logo display is available on Standard and Premium listings.
        </p>
        {formState.logo_url ? (
          <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div
              aria-label={`${formState.provider_name || "Provider"} logo`}
              className="h-16 w-16 shrink-0 rounded-md border border-neutral-200 bg-white bg-cover bg-center"
              role="img"
              style={{ backgroundImage: `url("${formState.logo_url}")` }}
            />
            <p className="break-all text-xs text-neutral-600">
              {formState.logo_url}
            </p>
          </div>
        ) : null}
        {logoUploadMessage ? (
          <p className="mt-3 text-sm font-medium text-primary-dark">
            {logoUploadMessage}
          </p>
        ) : null}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            accept="image/png,image/jpeg,image/webp"
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 file:mr-4 file:rounded-md file:border-0 file:bg-primary-light file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary-dark"
            onChange={handleLogoFileChange}
            type="file"
          />
          <button
            className="btn-secondary w-full shrink-0 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            disabled={isLogoUploading || !logoFile}
            onClick={handleLogoUpload}
            type="button"
          >
            {isLogoUploading ? "Uploading..." : "Upload logo"}
          </button>
        </div>
      </section>

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

      <button
        className="btn-primary w-full"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
