import { createClient } from "@/lib/supabase/server";
import { MemberList } from "@/components/team/member-list";
import { InviteDialog } from "@/components/team/invite-dialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export default async function PeoplePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberRows } = await supabase
    .from("project_members")
    .select("*")
    .eq("project_id", projectId)
    .order("joined_at", { ascending: true });

  const members = await Promise.all(
    (memberRows || []).map(async (member) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", member.user_id)
        .single();
      return { ...member, profile: profile! };
    })
  );

  const currentMember = members.find((m) => m.user_id === user?.id);
  const isOwner = currentMember?.role === "owner";

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          Team members ({members.length})
        </h2>
        {isOwner && (
          <InviteDialog projectId={projectId}>
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-1" />
              Invite
            </Button>
          </InviteDialog>
        )}
      </div>

      <MemberList
        members={members}
        projectId={projectId}
        currentUserId={user!.id}
        isOwner={isOwner}
      />
    </>
  );
}
