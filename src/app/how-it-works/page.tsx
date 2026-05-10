import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "How families search for aged care providers and providers manage profiles on CareConnect India.",
};

export default function HowItWorksPage() {
  return (
    <PlaceholderPage
      eyebrow="How it works"
      title="How it works"
      description="Simple placeholder for the family and provider journey in the MVP."
    >
      <p>
        The detailed workflow will be added after the approved MVP user flows
        are finalized.
      </p>
    </PlaceholderPage>
  );
}
