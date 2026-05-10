import Link from "next/link";
import { ProviderLeadList } from "@/components/provider-portal/ProviderLeadList";
import { ErrorState } from "@/components/ui/ErrorState";
import type { Enquiry, Provider } from "@/lib/types";
import {
  getInternalBaseUrl,
  getInternalFetchHeaders,
} from "@/lib/utils/internal-api";

export const dynamic = "force-dynamic";

type ProviderLeadsResponse =
  | { success: true; data: { provider: Provider | null; leads: Enquiry[] } }
  | { success: false; error: string };

async function getLeads() {
  try {
    const response = await fetch(`${getInternalBaseUrl()}/api/provider/leads`, {
      cache: "no-store",
      headers: getInternalFetchHeaders(),
    });
    const result = (await response.json()) as ProviderLeadsResponse;

    if (!response.ok || !result.success) {
      return {
        provider: null,
        leads: [],
        error: result.success ? "Unable to load leads." : result.error,
      };
    }

    return {
      provider: result.data.provider,
      leads: result.data.leads,
      error: "",
    };
  } catch {
    return { provider: null, leads: [], error: "Unable to load leads." };
  }
}

export default async function DashboardLeadsPage() {
  const { provider, leads, error } = await getLeads();

  if (error) {
    return (
      <section className="section-container py-10 md:py-14">
        <ErrorState message={error} title="Leads unavailable" />
      </section>
    );
  }

  if (!provider) {
    return (
      <section className="section-container py-10 md:py-14">
        <div className="card max-w-3xl">
          <h1 className="text-3xl font-bold tracking-normal text-neutral-950">
            Please register your provider profile first.
          </h1>
          <Link
            className="btn-primary mt-6"
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
    <section className="section-container py-10 md:py-14">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Provider portal</p>
          <h1 className="mt-3 text-3xl font-bold tracking-normal text-neutral-950">
            Leads
          </h1>
          <p className="mt-4 text-sm leading-6 text-neutral-700">
            Enquiries submitted by families for {provider.provider_name}.
          </p>
        </div>
        <Link className="btn-secondary" href="/dashboard">
          Back to dashboard
        </Link>
      </div>

      <ProviderLeadList leads={leads} />
    </section>
  );
}
