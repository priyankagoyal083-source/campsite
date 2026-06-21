"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createMessage(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  const { data, error } = await supabase
    .from("messages")
    .insert({
      project_id: projectId,
      title,
      content,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/messages`);
  redirect(`/projects/${projectId}/messages/${data.id}`);
}

export async function deleteMessage(messageId: string, projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/messages`);
  redirect(`/projects/${projectId}/messages`);
}
