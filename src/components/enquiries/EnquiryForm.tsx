"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { SERVICE_TYPES } from "@/lib/constants";
import type { ServiceType } from "@/lib/types";

type EnquiryFormProps = {
  providerId: string;
  providerServiceTypes: ServiceType[];
};

type FormState = {
  family_name: string;
  family_phone: string;
  family_email: string;
  service_needed: string;
  message: string;
};

const initialFormState: FormState = {
  family_name: "",
  family_phone: "",
  family_email: "",
  service_needed: "",
  message: "",
};

export function EnquiryForm({
  providerId,
  providerServiceTypes,
}: EnquiryFormProps) {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const serviceOptions = useMemo(() => {
    if (!providerServiceTypes.length) {
      return SERVICE_TYPES;
    }

    const providerServiceTypeSet = new Set(providerServiceTypes);
    return SERVICE_TYPES.filter((serviceType) =>
      providerServiceTypeSet.has(serviceType.value),
    );
  }, [providerServiceTypes]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setFormState((currentFormState) => ({
      ...currentFormState,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider_id: providerId,
          family_name: formState.family_name,
          family_phone: formState.family_phone,
          family_email: formState.family_email || undefined,
          service_needed: formState.service_needed,
          message: formState.message || undefined,
        }),
      });

      const result = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Unable to submit enquiry.");
      }

      setFormState(initialFormState);
      setSuccessMessage(
        "Your enquiry has been submitted. The provider will contact you directly.",
      );
    } catch {
      setErrorMessage("We could not submit your enquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
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
          Family name
        </span>
        <input
          className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
          name="family_name"
          onChange={handleChange}
          required
          type="text"
          value={formState.family_name}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-800">
          Phone number
        </span>
        <input
          className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
          name="family_phone"
          onChange={handleChange}
          required
          type="tel"
          value={formState.family_phone}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-800">
          Email (optional)
        </span>
        <input
          className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
          name="family_email"
          onChange={handleChange}
          type="email"
          value={formState.family_email}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-800">
          Service needed
        </span>
        <select
          className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
          name="service_needed"
          onChange={handleChange}
          required
          value={formState.service_needed}
        >
          <option value="">Select service</option>
          {serviceOptions.map((serviceType) => (
            <option key={serviceType.value} value={serviceType.value}>
              {serviceType.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-800">
          Message (optional)
        </span>
        <textarea
          className="mt-2 min-h-28 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
          name="message"
          onChange={handleChange}
          value={formState.message}
        />
      </label>

      <button
        className="btn-primary w-full"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Submitting..." : "Submit enquiry"}
      </button>
    </form>
  );
}
