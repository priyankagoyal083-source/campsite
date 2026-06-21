"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react";
import { TodoItem } from "./todo-item";
import { AddTodoForm } from "./add-todo-form";
import { EditTodoListDialog } from "./edit-todo-list-dialog";
import { deleteTodoList, reorderTodoList } from "@/actions/todos";
import { toast } from "sonner";
import type { Profile } from "@/lib/types/database";
import { useState } from "react";

export function TodoListCard({
  list,
  todos,
  projectId,
  members,
  isFirst,
  isLast,
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
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const completedCount = todos.filter((t) => t.completed).length;

  async function handleDelete() {
    if (!confirm(`Delete "${list.name}" and all its to-dos?`)) return;
    const result = await deleteTodoList(list.id, projectId);
    if (result?.error) toast.error(result.error);
    else toast.success("List deleted");
  }

  async function handleReorder(direction: "up" | "down") {
    await reorderTodoList(list.id, projectId, direction);
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{list.name}</CardTitle>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground mr-1">
                {completedCount}/{todos.length}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon-sm" />
                  }
                >
                  <MoreVertical className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!isFirst && (
                    <DropdownMenuItem onClick={() => handleReorder("up")}>
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Move up
                    </DropdownMenuItem>
                  )}
                  {!isLast && (
                    <DropdownMenuItem onClick={() => handleReorder("down")}>
                      <ArrowDown className="h-4 w-4 mr-2" />
                      Move down
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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

      <EditTodoListDialog
        list={list}
        projectId={projectId}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
