import Link from "next/link";
import type { Metadata } from "next";
import { HomeSearchForm } from "@/components/search/HomeSearchForm";

export const metadata: Metadata = {
  title: "Find Aged Care Providers in Visakhapatnam",
  description:
    "Search local home care, senior living, day care, physiotherapy, doctor, companion, and dementia care providers in Visakhapatnam.",
  openGraph: {
    title: "CareConnect India",
    description:
      "Find and contact aged care providers in Visakhapatnam with CareConnect India.",
    type: "website",
  },
};

export default function Home() {
  return (
    <>
      <section className="section-container py-8 sm:py-10 md:py-16">
        <div className="max-w-4xl">
          <p className="eyebrow">Visakhapatnam aged care discovery</p>
          <h1 className="mt-3 text-[40px] font-bold leading-tight tracking-normal text-neutral-950 sm:text-5xl lg:text-6xl">
            Find trusted aged care support for your family in Vizag.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-700 sm:mt-5 sm:text-lg sm:leading-8">
            CareConnect India helps families compare local home care, senior
            living, day care, physiotherapy, doctor, companion, and dementia
            care providers in one simple place.
          </p>

          <HomeSearchForm />
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-white py-8 sm:py-10">
        <div className="section-container grid gap-5 md:grid-cols-3">
          <article>
            <h2 className="text-lg font-semibold text-neutral-950">
              Search by need
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700">
              Choose the care service and area that match your family&apos;s
              situation.
            </p>
          </article>
          <article>
            <h2 className="text-lg font-semibold text-neutral-950">
              Compare providers
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700">
              Review services, areas covered, languages, pricing range, and
              verification status.
            </p>
          </article>
          <article>
            <h2 className="text-lg font-semibold text-neutral-950">
              Send an enquiry
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700">
              Submit your contact details and care need. The provider can then
              contact you directly.
            </p>
          </article>
        </div>
      </section>

      <section className="section-container py-8 sm:py-10">
        <div className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-primary-light p-4 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary-dark">
              Not sure where to start?
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-700">
              Browse all active providers and narrow the results when you know
              the service or location.
            </p>
          </div>
          <Link className="btn-secondary w-full bg-white sm:w-auto" href="/search">
            Browse providers
          </Link>
        </div>
      </section>
    </>
  );
}
