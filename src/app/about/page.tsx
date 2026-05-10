import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about CareConnect India, an MVP aged care services aggregator for Visakhapatnam.",
};

export default function AboutPage() {
  return (
    <PlaceholderPage
      eyebrow="About"
      title="About CareConnect India"
      description="CareConnect India is an MVP aged care services aggregator focused on Visakhapatnam."
    >
      <p>
        This page will later explain provider verification and the local launch
        approach.
      </p>
    </PlaceholderPage>
  );
}
