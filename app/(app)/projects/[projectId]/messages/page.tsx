import { createClient } from "@/lib/supabase/server";
import { MessageCard } from "@/components/messages/message-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const messagesWithAuthors = await Promise.all(
    (messages || []).map(async (message) => {
      const { data: author } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", message.created_by)
        .single();

      const { count } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("message_id", message.id);

      return { ...message, author: author!, comment_count: count || 0 };
    })
  );

  return (
    <>
      <div className="flex justify-end mb-4">
        <Link href={`/projects/${projectId}/messages/new`}>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New message
          </Button>
        </Link>
      </div>

      {messagesWithAuthors.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No messages yet</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Post a message to share updates with your team
          </p>
          <Link href={`/projects/${projectId}/messages/new`}>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Post a message
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {messagesWithAuthors.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              projectId={projectId}
            />
          ))}
        </div>
      )}
    </>
  );
}
