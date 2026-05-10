import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Header() {
  const publicNavItems = siteConfig.navItems.filter(
    (item) => item.href !== "/register-provider",
  );

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="section-container flex min-h-16 flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="text-lg font-bold tracking-normal text-primary"
          href="/"
        >
          {siteConfig.name}
        </Link>

        <nav aria-label="Primary navigation">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-neutral-700">
            {publicNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  className="transition-colors hover:text-primary"
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <SignedOut>
              <li>
                <Link
                  className="transition-colors hover:text-primary"
                  href="/register-provider"
                  prefetch={false}
                >
                  Register Provider
                </Link>
              </li>
              <li>
                <SignInButton mode="redirect">
                  <button
                    className="font-semibold text-primary transition-colors hover:text-primary-dark"
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
                  className="transition-colors hover:text-primary"
                  href="/dashboard"
                  prefetch={false}
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  className="transition-colors hover:text-primary"
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
