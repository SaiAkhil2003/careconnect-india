import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <section className="section-container flex justify-center py-12 md:py-16">
      <SignUp />
    </section>
  );
}
