"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";

function extractMentions(text: string): string[] {
  const matches = text.match(/@(\S+)/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(1).toLowerCase());
}

export async function createTodoComment(
  todoId: string,
  projectId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const content = formData.get("content") as string;

  const { error } = await supabase.from("todo_comments").insert({
    todo_id: todoId,
    content,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  const mentions = extractMentions(content);

  if (mentions.length > 0) {
    const { data: commenter } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const commenterName = commenter?.full_name || commenter?.email || "Someone";

    const { data: todo } = await supabase
      .from("todos")
      .select("title")
      .eq("id", todoId)
      .single();

    const { data: project } = await supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .single();

    const { data: memberRows } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId);

    const memberIds = (memberRows || []).map((m) => m.user_id);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", memberIds);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://basecamp-nu-bice.vercel.app";

    for (const profile of profiles || []) {
      if (profile.id === user.id) continue;

      const nameMatches = mentions.some((mention) => {
        const fullName = (profile.full_name || "").toLowerCase();
        const firstName = fullName.split(" ")[0];
        const emailPrefix = profile.email.split("@")[0].toLowerCase();
        return (
          firstName === mention ||
          fullName.replace(/\s+/g, "") === mention ||
          emailPrefix === mention ||
          profile.email.toLowerCase() === mention
        );
      });

      if (nameMatches) {
        await supabase.from("notifications").insert({
          user_id: profile.id,
          type: "mention",
          title: "You were mentioned",
          message: `${commenterName} mentioned you on "${todo?.title || "a to-do"}"`,
          link: `/projects/${projectId}/todos`,
        });

        sendEmail({
          to: profile.email,
          subject: `[${project?.name || "Campsite"}] ${commenterName} mentioned you`,
          html: `
            <p>Hi ${profile.full_name || "there"},</p>
            <p><strong>${commenterName}</strong> mentioned you in a comment on:</p>
            <blockquote style="border-left:3px solid #ccc;padding-left:12px;margin:12px 0;color:#555;">
              <strong>${todo?.title || "a to-do"}</strong><br/>
              ${content}
            </blockquote>
            <p><a href="${appUrl}/projects/${projectId}/todos">View in Campsite</a></p>
          `,
        });
      }
    }
  }

  revalidatePath(`/projects/${projectId}/todos`);
}

export async function deleteTodoComment(
  commentId: string,
  projectId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("todo_comments")
    .delete()
    .eq("id", commentId);

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/todos`);
}
