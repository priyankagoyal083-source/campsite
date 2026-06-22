import { createClient } from "@/lib/supabase/server";
import { TodoListsDnd } from "@/components/todos/todo-lists-dnd";
import { CreateTodoListDialog } from "@/components/todos/create-todo-list-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function TodosPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: todoLists } = await supabase
    .from("todo_lists")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  const { data: allTodos } = await supabase
    .from("todos")
    .select("*")
    .in(
      "todo_list_id",
      (todoLists || []).map((l) => l.id)
    )
    .order("position", { ascending: true });

  const todoIds = (allTodos || []).map((t) => t.id);

  let allComments: any[] = [];
  if (todoIds.length > 0) {
    const { data } = await supabase
      .from("todo_comments")
      .select("*")
      .in("todo_id", todoIds)
      .order("created_at", { ascending: true });
    allComments = data || [];
  }

  const { data: memberRows } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", projectId);

  const memberIds = memberRows?.map((m) => m.user_id) || [];
  let members: any[] = [];
  if (memberIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .in("id", memberIds);
    members = data || [];
  }

  return (
    <>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold tracking-tight mb-3">To-dos</h2>
        <CreateTodoListDialog projectId={projectId}>
          <Button variant="default" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New list
          </Button>
        </CreateTodoListDialog>
      </div>

      {(!todoLists || todoLists.length === 0) ? (
        <div className="text-center py-16">
          <h3 className="text-lg font-medium text-bc-meta">No to-do lists yet</h3>
          <p className="text-bc-meta mt-1 mb-4">
            Create a list to start tracking tasks
          </p>
          <CreateTodoListDialog projectId={projectId}>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Create a to-do list
            </Button>
          </CreateTodoListDialog>
        </div>
      ) : (
        <TodoListsDnd
          todoLists={todoLists}
          allTodos={allTodos || []}
          allComments={allComments}
          projectId={projectId}
          members={members}
          currentUserId={user!.id}
        />
      )}
    </>
  );
}
