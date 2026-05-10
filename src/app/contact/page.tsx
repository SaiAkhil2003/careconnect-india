import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact CareConnect India for family and provider enquiries about aged care services in Visakhapatnam.",
};

export default function ContactPage() {
  return (
    <PlaceholderPage
      eyebrow="Contact"
      title="Contact CareConnect India"
      description="Contact page placeholder for family and provider enquiries."
    >
      <p>
        Transactional email and WhatsApp lead delivery integrations are planned
        for later setup.
      </p>
    </PlaceholderPage>
  );
}
