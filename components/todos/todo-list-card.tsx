import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TodoItem } from "./todo-item";
import { AddTodoForm } from "./add-todo-form";
import type { Profile } from "@/lib/types/database";

export function TodoListCard({
  list,
  todos,
  projectId,
  members,
}: {
  list: { id: string; name: string; description: string | null };
  todos: {
    id: string;
    title: string;
    completed: boolean;
    assigned_to: string | null;
    due_date: string | null;
  }[];
  projectId: string;
  members: Profile[];
}) {
  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{list.name}</CardTitle>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{todos.length}
          </span>
        </div>
        {list.description && (
          <p className="text-sm text-muted-foreground">{list.description}</p>
        )}
        {todos.length > 0 && (
          <div className="w-full bg-muted rounded-full h-1.5 mt-2">
            <div
              className="bg-primary h-1.5 rounded-full transition-all"
              style={{
                width: `${todos.length > 0 ? (completedCount / todos.length) * 100 : 0}%`,
              }}
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              projectId={projectId}
              members={members}
            />
          ))}
        </div>
        <AddTodoForm todoListId={list.id} projectId={projectId} />
      </CardContent>
    </Card>
  );
}
