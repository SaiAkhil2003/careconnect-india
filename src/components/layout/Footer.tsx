import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="section-container flex flex-col gap-2 py-6 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold text-neutral-950">{siteConfig.name}</p>
        <p>{siteConfig.description}</p>
        <p>Launch market: {siteConfig.launchMarket}</p>
      </div>
    </footer>
  );
}
