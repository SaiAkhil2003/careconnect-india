import Link from "next/link";
import type { Metadata } from "next";
import { ProviderAnalyticsSummary } from "@/components/provider-portal/ProviderAnalyticsSummary";
import { ErrorState } from "@/components/ui/ErrorState";
import type { Provider, ProviderAnalytics } from "@/lib/types";
import {
  getInternalBaseUrl,
  getInternalFetchHeaders,
} from "@/lib/utils/internal-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Provider Analytics",
  robots: {
    index: false,
    follow: false,
  },
};

type ProviderMeResponse =
  | { success: true; data: { provider: Provider | null } }
  | { success: false; error: string };

type ProviderAnalyticsResponse =
  | {
      success: true;
      data: {
        total_profile_views: number;
        total_enquiries: number;
        daily_rows: ProviderAnalytics[];
      };
    }
  | { success: false; error: string };

async function getAnalytics() {
  try {
    const response = await fetch(
      `${getInternalBaseUrl()}/api/provider/analytics`,
      {
        cache: "no-store",
        headers: getInternalFetchHeaders(),
      },
    );
    const result = (await response.json()) as ProviderAnalyticsResponse;

    if (!response.ok || !result.success) {
      return {
        analytics: null,
        error: result.success ? "Unable to load analytics." : result.error,
      };
    }

    return { analytics: result.data, error: "" };
  } catch {
    return { analytics: null, error: "Unable to load analytics." };
  }
}

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

export default async function DashboardAnalyticsPage() {
  const { provider, error: profileError } = await getProviderProfile();

  if (profileError) {
    return (
      <section className="section-container py-8 sm:py-10 md:py-14">
        <ErrorState message={profileError} title="Analytics unavailable" />
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

  if ((provider.listing_tier ?? "free") === "free") {
    return (
      <section className="section-container py-8 sm:py-10 md:py-14">
        <div className="card max-w-3xl">
          <p className="eyebrow">Provider portal</p>
          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-normal text-neutral-950 sm:text-3xl">
            Analytics are available on Standard and Premium plans.
          </h1>
          <p className="mt-4 text-sm leading-6 text-neutral-700">
            Your profile views and enquiries are still tracked internally. Upgrade
            to view the detailed analytics dashboard.
          </p>
          <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
            <Link className="btn-primary w-full sm:w-auto" href="/dashboard/billing">
              Manage billing
            </Link>
            <Link className="btn-secondary w-full sm:w-auto" href="/dashboard">
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const { analytics, error } = await getAnalytics();

  if (error) {
    return (
      <section className="section-container py-8 sm:py-10 md:py-14">
        <ErrorState message={error} title="Analytics unavailable" />
      </section>
    );
  }

  return (
    <section className="section-container py-8 sm:py-10 md:py-14">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Provider portal</p>
          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-normal text-neutral-950 sm:text-3xl">
            Analytics
          </h1>
          <p className="mt-4 text-sm leading-6 text-neutral-700">
            Last 30 analytics rows for your provider profile.
          </p>
        </div>
        <Link className="btn-secondary w-full sm:w-auto" href="/dashboard">
          Back to dashboard
        </Link>
      </div>

      <ProviderAnalyticsSummary
        dailyRows={analytics?.daily_rows ?? []}
        totalEnquiries={analytics?.total_enquiries ?? 0}
        totalProfileViews={analytics?.total_profile_views ?? 0}
      />
    </section>
  );
}
