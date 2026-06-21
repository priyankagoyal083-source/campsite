"use client";

import { createTodo } from "@/actions/todos";
import { Input } from "@/components/ui/input";
import { useRef } from "react";

export function AddTodoForm({
  todoListId,
  projectId,
}: {
  todoListId: string;
  projectId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    const title = formData.get("title") as string;
    if (!title.trim()) return;
    await createTodo(todoListId, projectId, formData);
    formRef.current?.reset();
  }

  return (
    <form ref={formRef} action={handleSubmit} className="mt-2">
      <Input
        name="title"
        placeholder="Add a to-do..."
        className="h-8 text-sm"
        autoComplete="off"
      />
    </form>
  );
}
