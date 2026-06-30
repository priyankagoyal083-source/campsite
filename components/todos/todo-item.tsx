"use client";

import { toggleTodo, deleteTodo, assignTodo } from "@/actions/todos";
import { createTodoComment, deleteTodoComment } from "@/actions/todo-comments";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MentionTextarea } from "@/components/ui/mention-textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDraggable } from "@dnd-kit/core";
import { Trash2, MessageSquare, FileText, MoreHorizontal, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types/database";
import { useOptimistic, useTransition, useState, useRef } from "react";
import { useRouter } from "next/navigation";

type TodoComment = {
  id: string;
  content: string;
  created_by: string;
  created_at: string;
};

function RoundCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "shrink-0 size-5 rounded-full border-2 flex items-center justify-center transition-colors",
        checked
          ? "bg-bc-green border-bc-green"
          : "border-bc-meta/40 hover:border-bc-green"
      )}
      aria-label={checked ? "Mark incomplete" : "Mark complete"}
    >
      {checked && (
        <svg viewBox="0 0 12 12" className="size-3 text-white">
          <path
            d="M2 6l3 3 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

export function TodoItem({
  todo,
  projectId,
  members,
  comments,
  currentUserId,
  isDraggable,
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
  isDraggable?: boolean;
}) {
  const [optimisticCompleted, setOptimisticCompleted] = useOptimistic(
    todo.completed
  );
  const [, startTransition] = useTransition();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [posting, setPosting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: todo.id, disabled: !isDraggable });

  const dragStyle = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const assignee = members.find((m) => m.id === todo.assigned_to);

  function handleToggle() {
    startTransition(async () => {
      setOptimisticCompleted(!optimisticCompleted);
      await toggleTodo(todo.id, !todo.completed, projectId);
      router.refresh();
    });
  }

  async function handlePostComment(formData: FormData) {
    if (!commentText.trim()) return;
    setPosting(true);
    await createTodoComment(todo.id, projectId, formData);
    setPosting(false);
    setCommentText("");
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
    <li
      ref={setNodeRef}
      style={dragStyle}
      className={cn("py-3 px-1", isDragging && "opacity-30")}
    >
      <div className="flex items-center gap-3 group">
        {isDraggable && (
          <button
            {...attributes}
            {...listeners}
            className="shrink-0 cursor-grab active:cursor-grabbing text-bc-meta/40 hover:text-bc-meta touch-none"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <RoundCheckbox checked={optimisticCompleted} onChange={handleToggle} />

        <span
          className={cn(
            "flex-1 text-base cursor-pointer transition-colors",
            optimisticCompleted
              ? "text-bc-meta"
              : "text-foreground hover:text-bc-link"
          )}
          onClick={() => setExpanded(!expanded)}
        >
          {todo.title}
        </span>

        {comments.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-white bg-bc-comment-bg rounded-full px-2 py-0.5 hover:opacity-80"
          >
            <MessageSquare className="h-3 w-3" />
            {comments.length}
          </button>
        )}

        {assignee && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 outline-none">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px]">
                  {getInitials(assignee)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-bc-meta hidden sm:inline">
                {assignee.full_name?.split(" ")[0] || assignee.email.split("@")[0]}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => assignTodo(todo.id, null, projectId)}>
                Unassign
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
        )}

        {todo.due_date && (
          <span className="text-xs text-bc-meta">
            {new Date(todo.due_date).toLocaleDateString()}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-bc-meta opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
              />
            }
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setExpanded(!expanded)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments
            </DropdownMenuItem>
            {!assignee && (
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full">
                  <DropdownMenuItem>
                    <FileText className="h-4 w-4 mr-2" />
                    Assign
                  </DropdownMenuItem>
                </DropdownMenuTrigger>
              </DropdownMenu>
            )}
            {members.filter((m) => m.id !== todo.assigned_to).length > 0 && !assignee && (
              <>
                {members.map((member) => (
                  <DropdownMenuItem
                    key={member.id}
                    onClick={() => assignTodo(todo.id, member.id, projectId)}
                    className="pl-8"
                  >
                    {member.full_name || member.email}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuItem
              onClick={() => deleteTodo(todo.id, projectId)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded && (
        <div className="ml-8 mb-1 mt-3 border-l-2 border-bc-divider pl-4">
          {comments.length > 0 && (
            <div className="space-y-3 mb-3">
              {comments.map((comment) => {
                const author = members.find((m) => m.id === comment.created_by);
                return (
                  <div key={comment.id} className="flex gap-2 group/comment">
                    <Avatar className="h-6 w-6 mt-0.5 shrink-0">
                      <AvatarFallback className="text-[10px]">
                        {getInitials(author)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">
                          {author?.full_name || author?.email || "Unknown"}
                        </span>
                        <span className="text-sm text-bc-meta">
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
                      <p className="text-base whitespace-pre-wrap mt-0.5">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <form ref={formRef} action={handlePostComment} className="flex gap-2">
            <MentionTextarea
              name="content"
              members={members}
              placeholder="Add a comment... (type @ to mention)"
              required
              className="text-sm min-h-[32px] flex-1"
              value={commentText}
              onChange={setCommentText}
            />
            <Button type="submit" size="sm" disabled={posting} className="shrink-0">
              {posting ? "..." : "Post"}
            </Button>
          </form>
        </div>
      )}
    </li>
  );
}
