import type { ReactNode } from "react";

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  children,
}: PlaceholderPageProps) {
  return (
    <section className="section-container py-8 sm:py-10 md:py-16">
      <div className="card max-w-3xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-2xl font-bold leading-tight tracking-normal text-neutral-950 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral-700">
          {description}
        </p>
        {children ? (
          <div className="mt-6 border-t border-neutral-200 pt-6 text-sm leading-6 text-neutral-700">
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}
