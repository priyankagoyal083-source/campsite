"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createComment(
  messageId: string,
  projectId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const content = formData.get("content") as string;

  const { error } = await supabase.from("comments").insert({
    message_id: messageId,
    content,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/messages/${messageId}`);
}

export async function deleteComment(
  commentId: string,
  messageId: string,
  projectId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/messages/${messageId}`);
}
