import type { PublicProvider } from "@/lib/types";
import { ProviderCard } from "@/components/providers/ProviderCard";
import { EmptyState } from "@/components/ui/EmptyState";

type ProviderListProps = {
  providers: PublicProvider[];
};

export function ProviderList({ providers }: ProviderListProps) {
  if (providers.length === 0) {
    return (
      <EmptyState
        title="No providers found"
        message="No providers found for the selected filters."
      />
    );
  }

  return (
    <div className="space-y-5">
      {providers.map((provider) => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}
    </div>
  );
}
