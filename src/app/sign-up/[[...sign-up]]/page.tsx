import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignUpPage() {
  return (
    <section className="section-container flex justify-center py-12 md:py-16">
      <SignUp />
    </section>
  );
}
