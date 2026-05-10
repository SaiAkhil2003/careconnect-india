import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <section className="section-container flex justify-center py-12 md:py-16">
      <SignIn />
    </section>
  );
}
