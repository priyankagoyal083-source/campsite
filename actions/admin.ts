"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) throw new Error("Forbidden");

  return { supabase, user };
}

export async function adminGetUsers() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return data || [];
}

export async function adminGetProjects() {
  const { supabase } = await requireAdmin();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  const projectsWithCounts = await Promise.all(
    (projects || []).map(async (project) => {
      const { count: memberCount } = await supabase
        .from("project_members")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project.id);

      const { count: todoCount } = await supabase
        .from("todos")
        .select("*", { count: "exact", head: true })
        .in(
          "todo_list_id",
          (
            await supabase
              .from("todo_lists")
              .select("id")
              .eq("project_id", project.id)
          ).data?.map((l) => l.id) || []
        );

      const { data: creator } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", project.created_by)
        .single();

      return {
        ...project,
        member_count: memberCount || 0,
        todo_count: todoCount || 0,
        creator_name: creator?.full_name || creator?.email || "Unknown",
      };
    })
  );

  return projectsWithCounts;
}

export async function adminToggleAdmin(userId: string) {
  const { supabase } = await requireAdmin();

  const { data: target } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();

  if (!target) return { error: "User not found" };

  const { error } = await supabase
    .from("profiles")
    .update({ is_admin: !target.is_admin })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/admin/users");
}

export async function adminDeleteUser(userId: string) {
  const { supabase, user } = await requireAdmin();

  if (userId === user.id) return { error: "Cannot delete yourself" };

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/admin/users");
}

export async function adminDeleteProject(projectId: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) return { error: error.message };
  revalidatePath("/admin/projects");
  revalidatePath("/dashboard");
}
