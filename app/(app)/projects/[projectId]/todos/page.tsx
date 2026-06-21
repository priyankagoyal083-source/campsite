import { createClient } from "@/lib/supabase/server";
import { TodoListCard } from "@/components/todos/todo-list-card";
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
      <div className="flex justify-end mb-4">
        <CreateTodoListDialog projectId={projectId}>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New list
          </Button>
        </CreateTodoListDialog>
      </div>

      {(!todoLists || todoLists.length === 0) ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No to-do lists yet</h3>
          <p className="text-muted-foreground mt-1 mb-4">
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
        <div className="space-y-4">
          {todoLists.map((list) => (
            <TodoListCard
              key={list.id}
              list={list}
              todos={(allTodos || []).filter(
                (t) => t.todo_list_id === list.id
              )}
              projectId={projectId}
              members={members}
            />
          ))}
        </div>
      )}
    </>
  );
}
