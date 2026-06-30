"use client";

import { useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ArrowUp, ArrowDown, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { TodoItem } from "./todo-item";
import { AddTodoForm } from "./add-todo-form";
import { EditTodoListDialog } from "./edit-todo-list-dialog";
import { deleteTodoList, reorderTodoList } from "@/actions/todos";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
  isDndEnabled,
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
  isDndEnabled?: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: list.id });

  const activeTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);
  const completedCount = completedTodos.length;

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

        <ul
          ref={setNodeRef}
          className={cn(
            "divide-y divide-bc-divider border-t border-bc-divider min-h-[40px] transition-colors rounded",
            isOver && "bg-bc-link/5 border-bc-link/30"
          )}
        >
          {activeTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              projectId={projectId}
              members={members}
              comments={comments.filter((c) => c.todo_id === todo.id)}
              currentUserId={currentUserId}
              isDraggable={isDndEnabled}
            />
          ))}
          {activeTodos.length === 0 && (
            <li className="py-4 text-center text-sm text-bc-meta">
              {todos.length === 0 ? "Drop a to-do here" : "All done!"}
            </li>
          )}
        </ul>

        <AddTodoForm todoListId={list.id} projectId={projectId} />

        {completedCount > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-1 text-sm text-bc-meta hover:text-foreground transition-colors"
            >
              {showCompleted ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              {completedCount} completed
            </button>

            {showCompleted && (
              <ul className="divide-y divide-bc-divider border-t border-bc-divider mt-2">
                {completedTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    projectId={projectId}
                    members={members}
                    comments={comments.filter((c) => c.todo_id === todo.id)}
                    currentUserId={currentUserId}
                    isDraggable={false}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
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
