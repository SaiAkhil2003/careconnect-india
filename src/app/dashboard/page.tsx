import Link from "next/link";
import type { Metadata } from "next";
import { ProviderAnalyticsSummary } from "@/components/provider-portal/ProviderAnalyticsSummary";
import { ProviderLeadList } from "@/components/provider-portal/ProviderLeadList";
import { ProviderStatusCard } from "@/components/provider-portal/ProviderStatusCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { getListingPlan } from "@/lib/payments/plans";
import type { Enquiry, Provider, ProviderAnalytics } from "@/lib/types";
import { formatListingTier } from "@/lib/utils/format";
import {
  getInternalBaseUrl,
  getInternalFetchHeaders,
} from "@/lib/utils/internal-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Provider Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

type ProviderMeResponse =
  | { success: true; data: { provider: Provider | null } }
  | { success: false; error: string };

type ProviderLeadsResponse =
  | { success: true; data: { provider: Provider | null; leads: Enquiry[] } }
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

async function fetchJson<T>(path: string) {
  const response = await fetch(`${getInternalBaseUrl()}${path}`, {
    cache: "no-store",
    headers: getInternalFetchHeaders(),
  });

  return (await response.json()) as T;
}

async function getDashboardData() {
  try {
    const [profileResult, leadsResult, analyticsResult] = await Promise.all([
      fetchJson<ProviderMeResponse>("/api/provider/me"),
      fetchJson<ProviderLeadsResponse>("/api/provider/leads"),
      fetchJson<ProviderAnalyticsResponse>("/api/provider/analytics"),
    ]);

    if (!profileResult.success) {
      return { error: profileResult.error };
    }

    return {
      provider: profileResult.data.provider,
      leads: leadsResult.success ? leadsResult.data.leads : [],
      analytics: analyticsResult.success
        ? analyticsResult.data
        : { total_profile_views: 0, total_enquiries: 0, daily_rows: [] },
      error: "",
    };
  } catch {
    return { error: "Unable to load dashboard." };
  }
}

function getLeadDeliveryStatus(provider: Provider) {
  const plan = getListingPlan(provider.listing_tier);
  const hasLeadEmail = Boolean(provider.lead_email);
  const hasLeadWhatsApp = Boolean(provider.lead_whatsapp);

  if (plan.tier === "premium") {
    if (hasLeadEmail && hasLeadWhatsApp) {
      return "Email and WhatsApp lead alerts are ready when integrations are configured.";
    }

    if (hasLeadEmail) {
      return "Email lead alerts are ready. Add a lead WhatsApp number for Premium WhatsApp alerts.";
    }

    if (hasLeadWhatsApp) {
      return "WhatsApp lead alerts are ready when Twilio is configured. Add a lead email for email alerts.";
    }

    return "Add lead email and lead WhatsApp details in your profile to use Premium lead alerts.";
  }

  if (plan.tier === "standard") {
    return hasLeadEmail
      ? "Email lead alerts are ready when Resend is configured."
      : "Add a lead email in your profile to use Standard email alerts.";
  }

  return "Free plan leads are stored in your dashboard only.";
}

export default async function DashboardPage() {
  const { provider, leads, analytics, error } = await getDashboardData();

  if (error) {
    return (
      <section className="section-container py-8 sm:py-10 md:py-14">
        <ErrorState message={error} title="Dashboard unavailable" />
      </section>
    );
  }

  if (!provider) {
    return (
      <section className="section-container py-8 sm:py-10 md:py-14">
        <div className="card max-w-3xl">
          <p className="eyebrow">Provider dashboard</p>
          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-normal text-neutral-950 sm:text-3xl">
            You have not created a provider profile yet.
          </h1>
          <p className="mt-4 text-sm leading-6 text-neutral-700">
            Register your provider profile first. It will become public after
            admin approval.
          </p>
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

  const recentLeads = leads?.slice(0, 3) ?? [];
  const totalLeads = leads?.length ?? 0;
  const totalProfileViews = analytics?.total_profile_views ?? 0;

  return (
    <section className="section-container py-8 sm:py-10 md:py-14">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">Provider dashboard</p>
          <h1 className="mt-3 break-words text-2xl font-bold leading-tight tracking-normal text-neutral-950 sm:text-3xl">
            {provider.provider_name}
          </h1>
        </div>
        <div className="grid gap-3 sm:flex sm:flex-wrap md:justify-end">
          <Link className="btn-secondary w-full sm:w-auto" href="/dashboard/billing">
            Manage billing
          </Link>
          <Link className="btn-secondary w-full sm:w-auto" href="/dashboard/profile">
            Edit profile
          </Link>
          {provider.is_active ? (
            <Link
              className="btn-primary w-full sm:w-auto"
              href={`/providers/${provider.slug}`}
            >
              View public profile
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="mb-4 text-xl font-semibold text-neutral-950">
            Provider summary
          </h2>
          <ProviderStatusCard provider={provider} />
        </section>

        <section className="card">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-neutral-950">
                Current plan
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-700">
                You are on the{" "}
                <span className="font-semibold">
                  {formatListingTier(provider.listing_tier)}
                </span>{" "}
                plan. {getListingPlan(provider.listing_tier).priceLabel}
              </p>
              <p className="mt-3 text-sm leading-6 text-neutral-700">
                Lead delivery:{" "}
                <span className="font-semibold">
                  {getLeadDeliveryStatus(provider)}
                </span>
              </p>
            </div>
            <Link
              className="btn-secondary w-full shrink-0 sm:w-auto"
              href="/dashboard/billing"
            >
              Manage billing
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="card">
            <p className="text-sm font-medium text-neutral-600">Total leads</p>
            <p className="mt-2 text-2xl font-bold text-neutral-950 sm:text-3xl">
              {totalLeads}
            </p>
          </article>
          <article className="card">
            <p className="text-sm font-medium text-neutral-600">
              Total profile views
            </p>
            <p className="mt-2 text-2xl font-bold text-neutral-950 sm:text-3xl">
              {totalProfileViews}
            </p>
          </article>
        </section>

        <section className="card">
          <h2 className="text-xl font-semibold text-neutral-950">
            Approval status
          </h2>
          <p className="mt-3 text-sm leading-6 text-neutral-700">
            Your listing is currently{" "}
            <span className="font-semibold">
              {provider.is_active ? "active" : "pending admin approval"}
            </span>
            . Verification status is{" "}
            <span className="font-semibold">
              {provider.is_verified ? "verified" : "not verified"}
            </span>
            , and your listing tier is{" "}
            <span className="font-semibold">
              {formatListingTier(provider.listing_tier)}
            </span>
            .
          </p>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-neutral-950">
              Recent leads
            </h2>
            <Link
              className="text-sm font-semibold text-primary hover:text-primary-dark"
              href="/dashboard/leads"
            >
              View all
            </Link>
          </div>
          <ProviderLeadList leads={recentLeads} />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-neutral-950">
              Analytics summary
            </h2>
            <Link
              className="text-sm font-semibold text-primary hover:text-primary-dark"
              href="/dashboard/analytics"
            >
              View analytics
            </Link>
          </div>
          <ProviderAnalyticsSummary
            totalEnquiries={analytics?.total_enquiries ?? 0}
            totalProfileViews={totalProfileViews}
          />
        </section>

        <section className="card">
          <h2 className="text-xl font-semibold text-neutral-950">
            Profile actions
          </h2>
          <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
            <Link className="btn-secondary w-full sm:w-auto" href="/dashboard/profile">
              Edit profile
            </Link>
            <Link className="btn-secondary w-full sm:w-auto" href="/dashboard/leads">
              View leads
            </Link>
            <Link className="btn-secondary w-full sm:w-auto" href="/dashboard/analytics">
              View analytics
            </Link>
            <Link className="btn-secondary w-full sm:w-auto" href="/dashboard/billing">
              Manage billing
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}
