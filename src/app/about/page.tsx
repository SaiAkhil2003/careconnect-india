import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about CareConnect India, an MVP aged care services aggregator with city-aware search.",
};

export default function AboutPage() {
  return (
    <PlaceholderPage
      eyebrow="About"
      title="About CareConnect India"
      description="CareConnect India is an MVP aged care services aggregator with pan-India city-aware search."
    >
      <p>
        Current provider data includes sample/demo listings for testing. Real
        provider coverage will expand after verification and consent city by
        city.
      </p>
    </PlaceholderPage>
  );
}
