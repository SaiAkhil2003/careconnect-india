import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Header() {
  const publicNavItems = siteConfig.navItems.filter(
    (item) => item.href !== "/register-provider",
  );

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="section-container flex min-h-16 min-w-0 flex-col items-stretch gap-3 py-3 sm:py-4 md:flex-row md:items-center md:justify-between">
        <Link
          className="shrink-0 text-lg font-bold tracking-normal text-primary"
          href="/"
        >
          {siteConfig.name}
        </Link>

        <nav
          aria-label="Primary navigation"
          className="min-w-0 max-w-full self-stretch md:w-auto md:self-auto"
        >
          <ul className="grid w-full min-w-0 max-w-full grid-cols-2 items-center justify-items-start gap-x-2 gap-y-1.5 text-[13px] font-medium text-neutral-700 min-[375px]:grid-cols-3 sm:flex sm:flex-wrap sm:gap-x-4 sm:gap-y-2 sm:text-sm md:justify-end">
            {publicNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  className="inline-flex min-h-8 items-center transition-colors hover:text-primary"
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <SignedOut>
              <li>
                <Link
                  className="inline-flex min-h-8 items-center transition-colors hover:text-primary"
                  href="/register-provider"
                  prefetch={false}
                >
                  Register Provider
                </Link>
              </li>
              <li>
                <SignInButton mode="redirect">
                  <button
                    className="inline-flex min-h-8 items-center font-semibold text-primary transition-colors hover:text-primary-dark"
                    type="button"
                  >
                    Sign In
                  </button>
                </SignInButton>
              </li>
            </SignedOut>
            <SignedIn>
              <li>
                <Link
                  className="inline-flex min-h-8 items-center transition-colors hover:text-primary"
                  href="/dashboard"
                  prefetch={false}
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  className="inline-flex min-h-8 items-center transition-colors hover:text-primary"
                  href="/register-provider"
                  prefetch={false}
                >
                  Register Provider
                </Link>
              </li>
              <li>
                <UserButton afterSignOutUrl="/" />
              </li>
            </SignedIn>
          </ul>
        </nav>
      </div>
    </header>
  );
}
