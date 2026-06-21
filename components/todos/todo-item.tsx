"use client";

import { toggleTodo, deleteTodo, assignTodo } from "@/actions/todos";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types/database";
import { useOptimistic, useTransition } from "react";

export function TodoItem({
  todo,
  projectId,
  members,
}: {
  todo: {
    id: string;
    title: string;
    completed: boolean;
    assigned_to: string | null;
    due_date: string | null;
  };
  projectId: string;
  members: Profile[];
}) {
  const [optimisticCompleted, setOptimisticCompleted] = useOptimistic(
    todo.completed
  );
  const [, startTransition] = useTransition();

  const assignee = members.find((m) => m.id === todo.assigned_to);

  function handleToggle() {
    startTransition(async () => {
      setOptimisticCompleted(!optimisticCompleted);
      await toggleTodo(todo.id, !todo.completed, projectId);
    });
  }

  return (
    <div className="flex items-center gap-2 py-1.5 px-1 group">
      <Checkbox
        checked={optimisticCompleted}
        onCheckedChange={handleToggle}
        className="shrink-0"
      />
      <span
        className={cn(
          "flex-1 text-sm",
          optimisticCompleted && "line-through text-muted-foreground"
        )}
      >
        {todo.title}
      </span>
      {todo.due_date && (
        <span className="text-xs text-muted-foreground">
          {new Date(todo.due_date).toLocaleDateString()}
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
            />
          }
        >
          {assignee ? (
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px]">
                {assignee.full_name?.[0]?.toUpperCase() ||
                  assignee.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <UserCircle className="h-4 w-4" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => assignTodo(todo.id, null, projectId)}>
            Unassigned
          </DropdownMenuItem>
          {members.map((member) => (
            <DropdownMenuItem
              key={member.id}
              onClick={() => assignTodo(todo.id, member.id, projectId)}
            >
              {member.full_name || member.email}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {assignee && (
        <Avatar className="h-5 w-5 shrink-0">
          <AvatarFallback className="text-[10px]">
            {assignee.full_name?.[0]?.toUpperCase() ||
              assignee.email[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
        onClick={() => deleteTodo(todo.id, projectId)}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
