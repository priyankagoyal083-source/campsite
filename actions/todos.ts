"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTodoList(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  const { data: maxPos } = await supabase
    .from("todo_lists")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const position = (maxPos?.position ?? -1) + 1;

  const { error } = await supabase.from("todo_lists").insert({
    project_id: projectId,
    name,
    description: description || null,
    position,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/todos`);
}

export async function createTodo(
  todoListId: string,
  projectId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const title = formData.get("title") as string;

  const { data: maxPos } = await supabase
    .from("todos")
    .select("position")
    .eq("todo_list_id", todoListId)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const position = (maxPos?.position ?? -1) + 1;

  const { error } = await supabase.from("todos").insert({
    todo_list_id: todoListId,
    title,
    position,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/todos`);
}

export async function toggleTodo(
  todoId: string,
  completed: boolean,
  projectId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("todos")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", todoId);

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/todos`);
}

export async function assignTodo(
  todoId: string,
  assignedTo: string | null,
  projectId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: todo } = await supabase
    .from("todos")
    .select("title")
    .eq("id", todoId)
    .single();

  const { error } = await supabase
    .from("todos")
    .update({
      assigned_to: assignedTo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", todoId);

  if (error) return { error: error.message };

  if (assignedTo && assignedTo !== user.id && todo) {
    const { data: assigner } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const assignerName = assigner?.full_name || assigner?.email || "Someone";

    await supabase.from("notifications").insert({
      user_id: assignedTo,
      type: "todo_assigned",
      title: "To-do assigned to you",
      message: `${assignerName} assigned you "${todo.title}"`,
      link: `/projects/${projectId}/todos`,
    });
  }

  revalidatePath(`/projects/${projectId}/todos`);
}

export async function moveTodoToList(
  todoId: string,
  newListId: string,
  projectId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: maxPos } = await supabase
    .from("todos")
    .select("position")
    .eq("todo_list_id", newListId)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const position = (maxPos?.position ?? -1) + 1;

  const { error } = await supabase
    .from("todos")
    .update({
      todo_list_id: newListId,
      position,
      updated_at: new Date().toISOString(),
    })
    .eq("id", todoId);

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/todos`);
}

export async function deleteTodo(todoId: string, projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("todos").delete().eq("id", todoId);

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/todos`);
}

export async function updateTodoList(
  listId: string,
  projectId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  const { error } = await supabase
    .from("todo_lists")
    .update({
      name,
      description: description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listId);

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/todos`);
}

export async function reorderTodoList(
  listId: string,
  projectId: string,
  direction: "up" | "down"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: lists } = await supabase
    .from("todo_lists")
    .select("id, position")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (!lists) return { error: "Failed to fetch lists" };

  const currentIndex = lists.findIndex((l) => l.id === listId);
  if (currentIndex === -1) return { error: "List not found" };

  const swapIndex =
    direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (swapIndex < 0 || swapIndex >= lists.length) return;

  const current = lists[currentIndex];
  const swap = lists[swapIndex];

  await supabase
    .from("todo_lists")
    .update({ position: swap.position })
    .eq("id", current.id);

  await supabase
    .from("todo_lists")
    .update({ position: current.position })
    .eq("id", swap.id);

  revalidatePath(`/projects/${projectId}/todos`);
}

export async function deleteTodoList(listId: string, projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("todo_lists")
    .delete()
    .eq("id", listId);

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/todos`);
}
