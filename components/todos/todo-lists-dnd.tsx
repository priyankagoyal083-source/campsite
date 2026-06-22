"use client";

import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useState, useEffect } from "react";
import { TodoListCard } from "./todo-list-card";
import { moveTodoToList } from "@/actions/todos";
import { toast } from "sonner";
import type { Profile } from "@/lib/types/database";

type TodoData = {
  id: string;
  title: string;
  completed: boolean;
  assigned_to: string | null;
  due_date: string | null;
  todo_list_id: string;
};

type ListData = {
  id: string;
  name: string;
  description: string | null;
};

type CommentData = {
  id: string;
  todo_id: string;
  content: string;
  created_by: string;
  created_at: string;
};

export function TodoListsDnd({
  todoLists,
  allTodos: initialTodos,
  allComments,
  projectId,
  members,
  currentUserId,
}: {
  todoLists: ListData[];
  allTodos: TodoData[];
  allComments: CommentData[];
  projectId: string;
  members: Profile[];
  currentUserId: string;
}) {
  const [allTodos, setAllTodos] = useState(initialTodos);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setAllTodos(initialTodos);
  }, [initialTodos]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const activeTodo = activeId
    ? allTodos.find((t) => t.id === activeId)
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const todoId = active.id as string;
    const overId = over.id as string;

    const todo = allTodos.find((t) => t.id === todoId);
    if (!todo) return;

    let targetListId: string | null = null;

    if (todoLists.some((l) => l.id === overId)) {
      targetListId = overId;
    } else {
      const overTodo = allTodos.find((t) => t.id === overId);
      if (overTodo) {
        targetListId = overTodo.todo_list_id;
      }
    }

    if (!targetListId || targetListId === todo.todo_list_id) return;

    setAllTodos((prev) =>
      prev.map((t) =>
        t.id === todoId ? { ...t, todo_list_id: targetListId } : t
      )
    );

    const result = await moveTodoToList(todoId, targetListId, projectId);
    if (result?.error) {
      toast.error(result.error);
      setAllTodos((prev) =>
        prev.map((t) =>
          t.id === todoId
            ? { ...t, todo_list_id: todo.todo_list_id }
            : t
        )
      );
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-12">
        {todoLists.map((list, index) => (
          <TodoListCard
            key={list.id}
            list={list}
            todos={allTodos.filter((t) => t.todo_list_id === list.id)}
            projectId={projectId}
            members={members}
            isFirst={index === 0}
            isLast={index === todoLists.length - 1}
            comments={allComments}
            currentUserId={currentUserId}
            isDndEnabled
          />
        ))}
      </div>
      <DragOverlay>
        {activeTodo ? (
          <div className="bg-card border border-bc-divider rounded-md px-3 py-2 shadow-lg text-base opacity-90">
            {activeTodo.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
