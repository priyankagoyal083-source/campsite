"use client";

import { createComment } from "@/actions/comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRef, useState } from "react";

export function CommentForm({
  messageId,
  projectId,
}: {
  messageId: string;
  projectId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    const content = formData.get("content") as string;
    if (!content.trim()) return;
    setPending(true);
    await createComment(messageId, projectId, formData);
    setPending(false);
    formRef.current?.reset();
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2">
      <Textarea
        name="content"
        placeholder="Add a comment..."
        rows={3}
        required
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Posting..." : "Post comment"}
        </Button>
      </div>
    </form>
  );
}
