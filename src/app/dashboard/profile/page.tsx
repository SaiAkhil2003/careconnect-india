import Link from "next/link";
import type { Metadata } from "next";
import { ProviderProfileForm } from "@/components/provider-portal/ProviderProfileForm";
import { ErrorState } from "@/components/ui/ErrorState";
import type { Provider } from "@/lib/types";
import {
  getInternalBaseUrl,
  getInternalFetchHeaders,
} from "@/lib/utils/internal-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Provider Profile",
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

export default async function DashboardProfilePage() {
  const { provider, error } = await getProviderProfile();

  if (error) {
    return (
      <section className="section-container py-8 sm:py-10 md:py-14">
        <ErrorState message={error} title="Profile unavailable" />
      </section>
    );
  }

  if (!provider) {
    return (
      <section className="section-container py-8 sm:py-10 md:py-14">
        <div className="card max-w-3xl">
          <h1 className="text-2xl font-bold leading-tight tracking-normal text-neutral-950 sm:text-3xl">
            Please register your provider profile first.
          </h1>
          <Link
            className="btn-primary mt-6 w-full sm:w-auto"
            href="/register-provider"
            prefetch={false}
          >
            Register provider
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section-container py-8 sm:py-10 md:py-14">
      <div className="max-w-4xl">
        <p className="eyebrow">Provider portal</p>
        <h1 className="mt-3 text-2xl font-bold leading-tight tracking-normal text-neutral-950 sm:text-3xl">
          Edit provider profile
        </h1>
        <p className="mt-4 text-sm leading-6 text-neutral-700">
          Update your provider details. Admin-managed fields such as approval,
          verification, listing tier, and billing IDs cannot be edited here.
        </p>
        <div className="mt-8">
          <ProviderProfileForm provider={provider} />
        </div>
      </div>
    </section>
  );
}
