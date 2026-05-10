import Link from "next/link";
import { ProviderAnalyticsSummary } from "@/components/provider-portal/ProviderAnalyticsSummary";
import { ErrorState } from "@/components/ui/ErrorState";
import type { ProviderAnalytics } from "@/lib/types";
import {
  getInternalBaseUrl,
  getInternalFetchHeaders,
} from "@/lib/utils/internal-api";

export const dynamic = "force-dynamic";

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

export default async function DashboardAnalyticsPage() {
  const { analytics, error } = await getAnalytics();

  if (error) {
    return (
      <section className="section-container py-10 md:py-14">
        <ErrorState message={error} title="Analytics unavailable" />
      </section>
    );
  }

  return (
    <section className="section-container py-10 md:py-14">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Provider portal</p>
          <h1 className="mt-3 text-3xl font-bold tracking-normal text-neutral-950">
            Analytics
          </h1>
          <p className="mt-4 text-sm leading-6 text-neutral-700">
            Last 30 analytics rows for your provider profile.
          </p>
        </div>
        <Link className="btn-secondary" href="/dashboard">
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
