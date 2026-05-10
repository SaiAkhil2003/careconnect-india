import type { ProviderAnalytics } from "@/lib/types";
import { formatDateOnly } from "@/lib/utils/date";

type ProviderAnalyticsSummaryProps = {
  totalProfileViews: number;
  totalEnquiries: number;
  dailyRows?: ProviderAnalytics[];
};

export function ProviderAnalyticsSummary({
  totalProfileViews,
  totalEnquiries,
  dailyRows = [],
}: ProviderAnalyticsSummaryProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <article className="card">
          <p className="text-sm font-medium text-neutral-600">
            Total profile views
          </p>
          <p className="mt-2 text-3xl font-bold text-neutral-950">
            {totalProfileViews}
          </p>
        </article>
        <article className="card">
          <p className="text-sm font-medium text-neutral-600">
            Total enquiries
          </p>
          <p className="mt-2 text-3xl font-bold text-neutral-950">
            {totalEnquiries}
          </p>
        </article>
      </div>

      {dailyRows.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Profile views</th>
                <th className="px-4 py-3 font-semibold">Enquiries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {dailyRows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-neutral-700">
                    {formatDateOnly(row.date)}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {row.profile_views ?? 0}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {row.enquiry_count ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
