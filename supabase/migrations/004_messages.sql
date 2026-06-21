create table public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  content text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages(id) on delete cascade not null,
  content text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.messages enable row level security;
alter table public.comments enable row level security;

create policy "Members can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = messages.project_id
      and project_members.user_id = auth.uid()
    )
  );

create policy "Members can create messages"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.project_members
      where project_members.project_id = messages.project_id
      and project_members.user_id = auth.uid()
    )
  );

create policy "Authors can update messages"
  on public.messages for update
  using (auth.uid() = created_by);

create policy "Authors can delete messages"
  on public.messages for delete
  using (auth.uid() = created_by);

create policy "Members can view comments"
  on public.comments for select
  using (
    exists (
      select 1 from public.project_members
      join public.messages on messages.id = comments.message_id
      where project_members.project_id = messages.project_id
      and project_members.user_id = auth.uid()
    )
  );

create policy "Members can create comments"
  on public.comments for insert
  with check (
    exists (
      select 1 from public.project_members
      join public.messages on messages.id = comments.message_id
      where project_members.project_id = messages.project_id
      and project_members.user_id = auth.uid()
    )
  );

create policy "Authors can update comments"
  on public.comments for update
  using (auth.uid() = created_by);

create policy "Authors can delete comments"
  on public.comments for delete
  using (auth.uid() = created_by);
