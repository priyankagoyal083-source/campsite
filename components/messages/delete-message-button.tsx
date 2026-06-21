"use client";

import { deleteMessage } from "@/actions/messages";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteMessageButton({
  messageId,
  projectId,
}: {
  messageId: string;
  projectId: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-destructive"
      onClick={() => {
        if (confirm("Delete this message?")) {
          deleteMessage(messageId, projectId);
        }
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
