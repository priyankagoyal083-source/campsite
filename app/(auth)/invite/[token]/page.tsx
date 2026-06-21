"use client";

import { signUp, signIn } from "@/actions/auth";
import { acceptInvitation } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"loading" | "accept" | "signup" | "login">("loading");

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setMode(user ? "accept" : "signup");
    }
    checkAuth();
  }, []);

  async function handleAccept() {
    setPending(true);
    setError(null);
    const result = await acceptInvitation(token);
    setPending(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    if (result?.projectId) {
      router.push(`/projects/${result.projectId}`);
    }
  }

  async function handleSignup(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await signUp(formData, "no-redirect");
    if (result?.error) {
      setPending(false);
      setError(result.error);
      return;
    }
    const acceptResult = await acceptInvitation(token);
    setPending(false);
    if (acceptResult?.error) {
      setError(acceptResult.error);
      return;
    }
    if (acceptResult?.projectId) {
      router.push(`/projects/${acceptResult.projectId}`);
    }
  }

  async function handleLogin(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await signIn(formData, "no-redirect");
    if (result?.error) {
      setPending(false);
      setError(result.error);
      return;
    }
    const acceptResult = await acceptInvitation(token);
    setPending(false);
    if (acceptResult?.error) {
      setError(acceptResult.error);
      return;
    }
    if (acceptResult?.projectId) {
      router.push(`/projects/${acceptResult.projectId}`);
    }
  }

  if (mode === "loading") {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <>
      <h2 className="text-xl font-semibold mb-2">You&apos;ve been invited</h2>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {mode === "accept" && (
        <>
          <p className="text-muted-foreground text-sm mb-4">
            Click below to join the project.
          </p>
          <Button onClick={handleAccept} className="w-full" disabled={pending}>
            {pending ? "Joining..." : "Accept invitation"}
          </Button>
        </>
      )}

      {mode === "signup" && (
        <>
          <p className="text-muted-foreground text-sm mb-4">
            Create an account to join the project.
          </p>
          <form action={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" name="full_name" type="text" placeholder="Jane Smith" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="At least 6 characters" required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creating account..." : "Create account & join"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-3">
            Already have an account?{" "}
            <button onClick={() => { setMode("login"); setError(null); }} className="text-primary underline">
              Sign in
            </button>
          </p>
        </>
      )}

      {mode === "login" && (
        <>
          <p className="text-muted-foreground text-sm mb-4">
            Sign in to join the project.
          </p>
          <form action={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="Your password" required />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Signing in..." : "Sign in & join"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-3">
            Need an account?{" "}
            <button onClick={() => { setMode("signup"); setError(null); }} className="text-primary underline">
              Create one
            </button>
          </p>
        </>
      )}
    </>
  );
}
