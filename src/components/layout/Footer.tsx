import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="section-container flex flex-col items-start gap-2 py-6 text-sm leading-6 text-neutral-600 md:flex-row md:items-center md:justify-between md:gap-6">
        <p className="font-semibold text-neutral-950">{siteConfig.name}</p>
        <p className="md:text-center">{siteConfig.description}</p>
        <p className="shrink-0">Coverage: {siteConfig.coverage}</p>
      </div>
    </footer>
  );
}
