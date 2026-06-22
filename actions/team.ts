"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addExistingMember(projectId: string, userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("project_members")
    .insert({ project_id: projectId, user_id: userId, role: "member" });

  if (error) {
    if (error.code === "23505") return { error: "Already a member" };
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}/people`);
  revalidatePath("/dashboard");
}

export async function getAvailableUsers(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: existingMembers } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", projectId);

  const memberIds = (existingMembers || []).map((m) => m.user_id);

  const { data: allUsers } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .order("full_name", { ascending: true });

  return (allUsers || []).filter((u) => !memberIds.includes(u.id));
}

export async function inviteMember(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const email = formData.get("email") as string;

  const { data: existing } = await supabase
    .from("invitations")
    .select("*")
    .eq("project_id", projectId)
    .eq("email", email)
    .eq("status", "pending")
    .single();

  if (existing) return { error: "An invitation is already pending for this email" };

  const { data: existingMember } = await supabase
    .from("project_members")
    .select("user_id, profiles!inner(email)")
    .eq("project_id", projectId)
    .eq("profiles.email", email)
    .single();

  if (existingMember) return { error: "This user is already a member" };

  const { data: invitation, error } = await supabase
    .from("invitations")
    .insert({
      project_id: projectId,
      email,
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/people`);
  return { token: invitation.token };
}

export async function removeMember(
  projectId: string,
  userId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  if (userId === user.id) return { error: "You cannot remove yourself" };

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/people`);
}

export async function acceptInvitation(token: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in first to accept this invitation" };

  const { data: invitation, error: fetchError } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .single();

  if (fetchError || !invitation) return { error: "Invalid or expired invitation" };

  if (new Date(invitation.expires_at) < new Date()) {
    return { error: "This invitation has expired" };
  }

  const { error: memberError } = await supabase
    .from("project_members")
    .insert({
      project_id: invitation.project_id,
      user_id: user.id,
      role: "member",
    });

  if (memberError) {
    if (memberError.code === "23505") {
      return { error: "You are already a member of this project" };
    }
    return { error: memberError.message };
  }

  await supabase
    .from("invitations")
    .update({ status: "accepted" })
    .eq("id", invitation.id);

  return { projectId: invitation.project_id };
}
