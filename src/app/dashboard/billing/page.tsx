import Link from "next/link";
import type { Metadata } from "next";
import { BillingClient } from "@/components/provider-portal/BillingClient";
import { ErrorState } from "@/components/ui/ErrorState";
import type { Provider } from "@/lib/types";
import {
  getInternalBaseUrl,
  getInternalFetchHeaders,
} from "@/lib/utils/internal-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Provider Billing",
  robots: {
    index: false,
    follow: false,
  },
};

type DashboardBillingPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

type ProviderMeResponse =
  | { success: true; data: { provider: Provider | null } }
  | { success: false; error: string };

function getSearchParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getCheckoutStatus(searchParams: DashboardBillingPageProps["searchParams"]) {
  if (getSearchParamValue(searchParams?.success) === "true") {
    return "success" as const;
  }

  if (getSearchParamValue(searchParams?.canceled) === "true") {
    return "canceled" as const;
  }

  return null;
}

async function getProvider() {
  try {
    const response = await fetch(`${getInternalBaseUrl()}/api/provider/me`, {
      cache: "no-store",
      headers: getInternalFetchHeaders(),
    });
    const result = (await response.json()) as ProviderMeResponse;

    if (!response.ok || !result.success) {
      return {
        provider: null,
        error: result.success ? "Unable to load billing." : result.error,
      };
    }

    return {
      provider: result.data.provider,
      error: "",
    };
  } catch {
    return { provider: null, error: "Unable to load billing." };
  }
}

export default async function DashboardBillingPage({
  searchParams,
}: DashboardBillingPageProps) {
  const { provider, error } = await getProvider();
  const checkoutStatus = getCheckoutStatus(searchParams);

  if (error) {
    return (
      <section className="section-container py-10 md:py-14">
        <ErrorState message={error} title="Billing unavailable" />
      </section>
    );
  }

  return (
    <section className="section-container py-10 md:py-14">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Provider portal</p>
          <h1 className="mt-3 text-3xl font-bold tracking-normal text-neutral-950">
            Billing
          </h1>
          <p className="mt-4 text-sm leading-6 text-neutral-700">
            Manage your CareConnect India listing plan.
          </p>
        </div>
        <Link className="btn-secondary" href="/dashboard">
          Back to dashboard
        </Link>
      </div>

      <BillingClient provider={provider} checkoutStatus={checkoutStatus} />
    </section>
  );
}
