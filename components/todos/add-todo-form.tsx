"use client";

import { createTodo } from "@/actions/todos";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRef, useState } from "react";

export function AddTodoForm({
  todoListId,
  projectId,
}: {
  todoListId: string;
  projectId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isAdding, setIsAdding] = useState(false);

  async function handleSubmit(formData: FormData) {
    const title = formData.get("title") as string;
    if (!title.trim()) return;
    await createTodo(todoListId, projectId, formData);
    formRef.current?.reset();
    inputRef.current?.focus();
  }

  if (!isAdding) {
    return (
      <button
        onClick={() => {
          setIsAdding(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="text-sm text-bc-meta hover:text-foreground py-3 flex items-center gap-1 transition-colors"
      >
        <Plus className="h-4 w-4" /> Add a to-do
      </button>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex gap-2 pt-3">
      <Input
        ref={inputRef}
        name="title"
        placeholder="Type a to-do..."
        className="flex-1 text-sm"
        autoComplete="off"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Escape") setIsAdding(false);
        }}
      />
      <Button type="submit" size="sm">
        Add
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsAdding(false)}
      >
        Cancel
      </Button>
    </form>
  );
}
