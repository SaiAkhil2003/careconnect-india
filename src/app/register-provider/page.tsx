import Link from "next/link";
import type { Metadata } from "next";
import { ProviderRegistrationForm } from "@/components/provider-portal/ProviderRegistrationForm";
import { ErrorState } from "@/components/ui/ErrorState";
import type { Provider } from "@/lib/types";
import {
  getInternalBaseUrl,
  getInternalFetchHeaders,
} from "@/lib/utils/internal-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Register Provider",
  robots: {
    index: false,
    follow: false,
  },
};

type ProviderMeResponse =
  | { success: true; data: { provider: Provider | null } }
  | { success: false; error: string };

async function getProviderProfile() {
  try {
    const response = await fetch(`${getInternalBaseUrl()}/api/provider/me`, {
      cache: "no-store",
      headers: getInternalFetchHeaders(),
    });
    const result = (await response.json()) as ProviderMeResponse;

    if (!response.ok || !result.success) {
      return {
        provider: null,
        error: result.success ? "Unable to load profile." : result.error,
      };
    }

    return { provider: result.data.provider, error: "" };
  } catch {
    return { provider: null, error: "Unable to load provider profile." };
  }
}

export default async function RegisterProviderPage() {
  const { provider, error } = await getProviderProfile();

  return (
    <section className="section-container py-8 sm:py-10 md:py-14">
      <div className="max-w-3xl">
        <p className="eyebrow">Register provider</p>
        <h1 className="mt-3 text-2xl font-bold leading-tight tracking-normal text-neutral-950 sm:text-3xl">
          Provider registration
        </h1>
        <p className="mt-4 text-sm leading-6 text-neutral-700">
          Submit your provider profile for admin approval. Listings become
          public only after approval in Supabase Studio.
        </p>
      </div>

      <div className="mt-8 max-w-4xl">
        {error ? (
          <ErrorState message={error} title="Profile check failed" />
        ) : provider ? (
          <div className="card">
            <h2 className="text-xl font-semibold text-neutral-950">
              You already have a provider profile.
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700">
              Manage your profile, leads, and analytics from the provider
              dashboard.
            </p>
            <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
              <Link
                className="btn-primary w-full sm:w-auto"
                href="/dashboard"
                prefetch={false}
              >
                Go to dashboard
              </Link>
              <Link
                className="btn-secondary w-full sm:w-auto"
                href="/dashboard/billing"
                prefetch={false}
              >
                Manage billing
              </Link>
            </div>
          </div>
        ) : (
          <ProviderRegistrationForm />
        )}
      </div>
    </section>
  );
}
