import type { Enquiry } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/date";
import { formatServiceType } from "@/lib/utils/format";
import { EmptyState } from "@/components/ui/EmptyState";

type ProviderLeadListProps = {
  leads: Enquiry[];
};

export function ProviderLeadList({ leads }: ProviderLeadListProps) {
  if (leads.length === 0) {
    return <EmptyState message="No enquiries received yet." title="No leads" />;
  }

  return (
    <div className="space-y-4">
      {leads.map((lead) => {
        const deliveryMethod = lead.delivery_method ?? "email";
        const deliveryLabel = lead.is_delivered
          ? `Delivered by ${deliveryMethod}`
          : "Stored in dashboard";

        return (
          <article className="card" key={lead.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="break-words text-lg font-semibold text-neutral-950">
                  {lead.family_name}
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  {formatDateTime(lead.created_at)}
                </p>
              </div>
              <span className="w-fit max-w-full rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                {deliveryLabel}
              </span>
            </div>

            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-neutral-950">Phone</dt>
                <dd className="mt-1 break-words text-neutral-700">
                  {lead.family_phone}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-neutral-950">Email</dt>
                <dd className="mt-1 break-words text-neutral-700">
                  {lead.family_email ?? "Not provided"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-neutral-950">
                  Service needed
                </dt>
                <dd className="mt-1 break-words text-neutral-700">
                  {lead.service_needed
                    ? formatServiceType(lead.service_needed)
                    : "Not listed"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-neutral-950">
                  Delivery method
                </dt>
                <dd className="mt-1 capitalize text-neutral-700">
                  {deliveryMethod}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-neutral-950">
                  Delivery status
                </dt>
                <dd className="mt-1 text-neutral-700">
                  {lead.is_delivered
                    ? "External provider alert sent"
                    : "Saved for dashboard follow-up"}
                </dd>
              </div>
            </dl>

            {lead.message ? (
              <div className="mt-4 break-words rounded-md bg-neutral-50 p-4 text-sm leading-6 text-neutral-700">
                {lead.message}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
