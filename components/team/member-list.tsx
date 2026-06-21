"use client";

import { removeMember } from "@/actions/team";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserMinus } from "lucide-react";
import type { ProjectMemberWithProfile } from "@/lib/types/database";
import { toast } from "sonner";

export function MemberList({
  members,
  projectId,
  currentUserId,
  isOwner,
}: {
  members: ProjectMemberWithProfile[];
  projectId: string;
  currentUserId: string;
  isOwner: boolean;
}) {
  async function handleRemove(userId: string, name: string) {
    if (!confirm(`Remove ${name} from this project?`)) return;
    const result = await removeMember(projectId, userId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`${name} removed from project`);
    }
  }

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const initials = member.profile.full_name
          ? member.profile.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          : member.profile.email[0].toUpperCase();

        return (
          <div
            key={member.id}
            className="flex items-center gap-3 p-3 rounded-md border"
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {member.profile.full_name || member.profile.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {member.profile.email}
              </p>
            </div>
            <Badge variant={member.role === "owner" ? "default" : "secondary"}>
              {member.role}
            </Badge>
            {isOwner && member.user_id !== currentUserId && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() =>
                  handleRemove(
                    member.user_id,
                    member.profile.full_name || member.profile.email
                  )
                }
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
