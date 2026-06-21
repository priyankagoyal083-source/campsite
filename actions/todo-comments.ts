"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
