import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign in — Campsite",
};

export default function LoginPage() {
  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Sign in to your account</h2>
      <LoginForm />
    </>
  );
}
