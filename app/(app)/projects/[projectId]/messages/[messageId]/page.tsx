import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CommentForm } from "@/components/messages/comment-form";
import { DeleteMessageButton } from "@/components/messages/delete-message-button";

export default async function MessageDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; messageId: string }>;
}) {
  const { projectId, messageId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: message } = await supabase
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .single();

  if (!message) notFound();

  const { data: author } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", message.created_by)
    .single();

  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("message_id", messageId)
    .order("created_at", { ascending: true });

  const commentAuthors = new Map<string, any>();
  for (const comment of comments || []) {
    if (!commentAuthors.has(comment.created_by)) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", comment.created_by)
        .single();
      if (data) commentAuthors.set(comment.created_by, data);
    }
  }

  const authorInitials = author?.full_name
    ? author.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : author?.email?.[0]?.toUpperCase() || "?";

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-xl font-semibold">{message.title}</h2>
        {user?.id === message.created_by && (
          <DeleteMessageButton messageId={messageId} projectId={projectId} />
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="text-xs">{authorInitials}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">
          {author?.full_name || author?.email}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(message.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="prose prose-sm max-w-none mb-6 whitespace-pre-wrap">
        {message.content}
      </div>

      <Separator className="my-6" />

      <h3 className="text-sm font-semibold mb-4">
        Comments ({comments?.length || 0})
      </h3>

      {comments && comments.length > 0 && (
        <div className="space-y-4 mb-6">
          {comments.map((comment) => {
            const ca = commentAuthors.get(comment.created_by);
            const ci = ca?.full_name
              ? ca.full_name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : ca?.email?.[0]?.toUpperCase() || "?";

            return (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-6 w-6 mt-0.5">
                  <AvatarFallback className="text-[10px]">{ci}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {ca?.full_name || ca?.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CommentForm messageId={messageId} projectId={projectId} />
    </div>
  );
}
