import type { Provider } from "@/lib/types";
import { formatListingTier } from "@/lib/utils/format";

type ProviderStatusCardProps = {
  provider: Provider;
};

export function ProviderStatusCard({ provider }: ProviderStatusCardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <article className="card">
        <p className="text-sm font-medium text-neutral-600">Provider status</p>
        <p className="mt-2 break-words text-xl font-bold text-neutral-950 sm:text-2xl">
          {provider.is_active ? "Active" : "Pending approval"}
        </p>
      </article>
      <article className="card">
        <p className="text-sm font-medium text-neutral-600">Verified status</p>
        <p className="mt-2 break-words text-xl font-bold text-neutral-950 sm:text-2xl">
          {provider.is_verified ? "Verified" : "Not verified"}
        </p>
      </article>
      <article className="card">
        <p className="text-sm font-medium text-neutral-600">Listing tier</p>
        <p className="mt-2 break-words text-xl font-bold text-neutral-950 sm:text-2xl">
          {formatListingTier(provider.listing_tier)}
        </p>
      </article>
    </div>
  );
}
