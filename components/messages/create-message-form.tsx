"use client";

import { createMessage } from "@/actions/messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export function CreateMessageForm({ projectId }: { projectId: string }) {
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    await createMessage(projectId, formData);
    setPending(false);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g. Project update for this week"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Message</Label>
        <Textarea
          id="content"
          name="content"
          placeholder="Write your message..."
          rows={10}
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Posting..." : "Post this message"}
        </Button>
      </div>
    </form>
  );
}
