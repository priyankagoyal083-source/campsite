"use client";

import { toggleTodo, deleteTodo, assignTodo } from "@/actions/todos";
import { createTodoComment, deleteTodoComment } from "@/actions/todo-comments";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, UserCircle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types/database";
import { useOptimistic, useTransition, useState, useRef } from "react";

type TodoComment = {
  id: string;
  content: string;
  created_by: string;
  created_at: string;
};

export function TodoItem({
  todo,
  projectId,
  members,
  comments,
  currentUserId,
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
  comments: TodoComment[];
  currentUserId: string;
}) {
  const [optimisticCompleted, setOptimisticCompleted] = useOptimistic(
    todo.completed
  );
  const [, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [posting, setPosting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const assignee = members.find((m) => m.id === todo.assigned_to);

  function handleToggle() {
    startTransition(async () => {
      setOptimisticCompleted(!optimisticCompleted);
      await toggleTodo(todo.id, !todo.completed, projectId);
    });
  }

  async function handlePostComment(formData: FormData) {
    const content = formData.get("content") as string;
    if (!content.trim()) return;
    setPosting(true);
    await createTodoComment(todo.id, projectId, formData);
    setPosting(false);
    formRef.current?.reset();
  }

  function getInitials(profile: Profile | undefined) {
    if (!profile) return "?";
    return profile.full_name
      ? profile.full_name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : profile.email[0].toUpperCase();
  }

  return (
    <div>
      <div className="flex items-center gap-2 py-1.5 px-1 group">
        <Checkbox
          checked={optimisticCompleted}
          onCheckedChange={handleToggle}
          className="shrink-0"
        />
        <span
          className={cn(
            "flex-1 text-base cursor-pointer",
            optimisticCompleted && "line-through text-muted-foreground"
          )}
          onClick={() => setExpanded(!expanded)}
        >
          {todo.title}
        </span>
        {comments.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <MessageSquare className="h-3 w-3" />
            {comments.length}
          </button>
        )}
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
                  {getInitials(assignee)}
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
              {getInitials(assignee)}
            </AvatarFallback>
          </Avatar>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100"
          onClick={() => setExpanded(!expanded)}
        >
          <MessageSquare className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
          onClick={() => deleteTodo(todo.id, projectId)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {expanded && (
        <div className="ml-7 mb-3 mt-1 border-l-2 border-muted pl-3">
          {comments.length > 0 && (
            <div className="space-y-2 mb-2">
              {comments.map((comment) => {
                const author = members.find((m) => m.id === comment.created_by);
                return (
                  <div key={comment.id} className="flex gap-2 group/comment">
                    <Avatar className="h-5 w-5 mt-0.5 shrink-0">
                      <AvatarFallback className="text-[10px]">
                        {getInitials(author)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">
                          {author?.full_name || author?.email || "Unknown"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                        {comment.created_by === currentUserId && (
                          <button
                            onClick={() =>
                              deleteTodoComment(comment.id, projectId)
                            }
                            className="opacity-0 group-hover/comment:opacity-100 text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-base whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <form ref={formRef} action={handlePostComment} className="flex gap-2">
            <Textarea
              name="content"
              placeholder="Add a comment..."
              rows={1}
              className="text-sm min-h-[32px] resize-none"
              required
            />
            <Button type="submit" size="sm" disabled={posting} className="shrink-0">
              {posting ? "..." : "Post"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
