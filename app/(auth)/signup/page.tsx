import { SignupForm } from "@/components/auth/signup-form";

export const metadata = {
  title: "Sign up — Campsite",
};

export default function SignupPage() {
  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Create your account</h2>
      <SignupForm />
    </>
  );
}
