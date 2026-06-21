create table public.todo_lists (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  description text,
  position integer default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.todos (
  id uuid primary key default gen_random_uuid(),
  todo_list_id uuid references public.todo_lists(id) on delete cascade not null,
  title text not null,
  description text,
  completed boolean default false,
  completed_at timestamptz,
  assigned_to uuid references public.profiles(id),
  due_date date,
  position integer default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.todo_lists enable row level security;
alter table public.todos enable row level security;

create policy "Members can view todo lists"
  on public.todo_lists for select
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = todo_lists.project_id
      and project_members.user_id = auth.uid()
    )
  );

create policy "Members can create todo lists"
  on public.todo_lists for insert
  with check (
    exists (
      select 1 from public.project_members
      where project_members.project_id = todo_lists.project_id
      and project_members.user_id = auth.uid()
    )
  );

create policy "Members can update todo lists"
  on public.todo_lists for update
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = todo_lists.project_id
      and project_members.user_id = auth.uid()
    )
  );

create policy "Members can delete todo lists"
  on public.todo_lists for delete
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = todo_lists.project_id
      and project_members.user_id = auth.uid()
    )
  );

create policy "Members can view todos"
  on public.todos for select
  using (
    exists (
      select 1 from public.project_members
      join public.todo_lists on todo_lists.id = todos.todo_list_id
      where project_members.project_id = todo_lists.project_id
      and project_members.user_id = auth.uid()
    )
  );

create policy "Members can create todos"
  on public.todos for insert
  with check (
    exists (
      select 1 from public.project_members
      join public.todo_lists on todo_lists.id = todos.todo_list_id
      where project_members.project_id = todo_lists.project_id
      and project_members.user_id = auth.uid()
    )
  );

create policy "Members can update todos"
  on public.todos for update
  using (
    exists (
      select 1 from public.project_members
      join public.todo_lists on todo_lists.id = todos.todo_list_id
      where project_members.project_id = todo_lists.project_id
      and project_members.user_id = auth.uid()
    )
  );

create policy "Members can delete todos"
  on public.todos for delete
  using (
    exists (
      select 1 from public.project_members
      join public.todo_lists on todo_lists.id = todos.todo_list_id
      where project_members.project_id = todo_lists.project_id
      and project_members.user_id = auth.uid()
    )
  );
