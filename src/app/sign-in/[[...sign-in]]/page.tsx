import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignInPage() {
  return (
    <section className="section-container flex justify-center py-12 md:py-16">
      <SignIn />
    </section>
  );
}
