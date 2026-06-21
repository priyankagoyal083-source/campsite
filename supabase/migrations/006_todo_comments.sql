create table public.todo_comments (
  id uuid primary key default gen_random_uuid(),
  todo_id uuid references public.todos(id) on delete cascade not null,
  content text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.todo_comments enable row level security;

create policy "Members can view todo comments"
  on public.todo_comments for select
  using (
    exists (
      select 1 from public.todos t
      join public.todo_lists tl on tl.id = t.todo_list_id
      where t.id = todo_comments.todo_id
      and tl.project_id in (select public.get_user_project_ids(auth.uid()))
    )
  );

create policy "Members can create todo comments"
  on public.todo_comments for insert
  with check (
    exists (
      select 1 from public.todos t
      join public.todo_lists tl on tl.id = t.todo_list_id
      where t.id = todo_comments.todo_id
      and tl.project_id in (select public.get_user_project_ids(auth.uid()))
    )
  );

create policy "Authors can delete todo comments"
  on public.todo_comments for delete
  using (auth.uid() = created_by);
