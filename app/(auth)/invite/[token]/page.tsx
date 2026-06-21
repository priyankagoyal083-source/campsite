"use client";

import { acceptInvitation } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setPending(true);
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

  return (
    <>
      <h2 className="text-xl font-semibold mb-2">You&apos;ve been invited</h2>
      <p className="text-muted-foreground text-sm mb-4">
        Click below to join the project.
      </p>
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      <Button onClick={handleAccept} className="w-full" disabled={pending}>
        {pending ? "Joining..." : "Accept invitation"}
      </Button>
    </>
  );
}
