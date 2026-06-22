"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react";
import { TodoItem } from "./todo-item";
import { AddTodoForm } from "./add-todo-form";
import { EditTodoListDialog } from "./edit-todo-list-dialog";
import { deleteTodoList, reorderTodoList } from "@/actions/todos";
import { toast } from "sonner";
import type { Profile } from "@/lib/types/database";
import { useState } from "react";

function ProgressPie({ completed, total }: { completed: number; total: number }) {
  const size = 28;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = total > 0 ? completed / total : 0;
  const offset = circumference * (1 - percent);

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--bc-divider)"
        strokeWidth={strokeWidth}
      />
      {total > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bc-green)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function TodoListCard({
  list,
  todos,
  projectId,
  members,
  isFirst,
  isLast,
  comments,
  currentUserId,
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
  comments: { id: string; todo_id: string; content: string; created_by: string; created_at: string }[];
  currentUserId: string;
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
      <section>
        <header className="flex items-center gap-3 mb-3">
          <ProgressPie completed={completedCount} total={todos.length} />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-extrabold tracking-tight truncate">
              {list.name}
            </h2>
            {list.description && (
              <p className="text-sm text-bc-meta mt-0.5">{list.description}</p>
            )}
          </div>
          <span className="text-sm text-bc-meta whitespace-nowrap">
            {completedCount}/{todos.length}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" className="text-bc-meta" />
              }
            >
              <MoreHorizontal className="h-4 w-4" />
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
        </header>

        <ul className="divide-y divide-bc-divider border-t border-bc-divider">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              projectId={projectId}
              members={members}
              comments={comments.filter((c) => c.todo_id === todo.id)}
              currentUserId={currentUserId}
            />
          ))}
        </ul>

        <AddTodoForm todoListId={list.id} projectId={projectId} />
      </section>

      <EditTodoListDialog
        list={list}
        projectId={projectId}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
