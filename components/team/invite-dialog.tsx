"use client";

import { inviteMember } from "@/actions/team";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export function InviteDialog({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    const result = await inviteMember(projectId, formData);
    setPending(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    if (result?.token) {
      const link = `${window.location.origin}/invite/${result.token}`;
      setInviteLink(link);
      toast.success("Invitation created");
    }
  }

  function handleCopy() {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success("Link copied to clipboard");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setInviteLink(null);
      }}
    >
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a team member</DialogTitle>
        </DialogHeader>
        {inviteLink ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Share this link with your teammate:
            </p>
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly className="text-sm" />
              <Button onClick={handleCopy} size="sm">
                Copy
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setInviteLink(null);
              }}
            >
              Invite another
            </Button>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="teammate@example.com"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Inviting..." : "Send invite"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
