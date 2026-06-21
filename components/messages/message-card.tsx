import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import type { MessageWithAuthor } from "@/lib/types/database";

export function MessageCard({
  message,
  projectId,
}: {
  message: MessageWithAuthor;
  projectId: string;
}) {
  const initials = message.author?.full_name
    ? message.author.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : message.author?.email?.[0]?.toUpperCase() || "?";

  return (
    <Link href={`/projects/${projectId}/messages/${message.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{message.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {message.author?.full_name || message.author?.email}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(message.created_at).toLocaleDateString()}
              </span>
            </div>
            {(message.comment_count ?? 0) > 0 && (
              <Badge variant="secondary" className="gap-1">
                <MessageSquare className="h-3 w-3" />
                {message.comment_count}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
