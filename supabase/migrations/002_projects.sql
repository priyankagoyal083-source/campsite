create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  archived_at timestamptz
);

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz default now(),
  unique (project_id, user_id)
);

alter table public.projects enable row level security;
alter table public.project_members enable row level security;

create policy "Members can view projects"
  on public.projects for select
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = projects.id
      and project_members.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create projects"
  on public.projects for insert
  with check (auth.uid() = created_by);

create policy "Owners can update projects"
  on public.projects for update
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = projects.id
      and project_members.user_id = auth.uid()
      and project_members.role = 'owner'
    )
  );

create policy "Owners can delete projects"
  on public.projects for delete
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = projects.id
      and project_members.user_id = auth.uid()
      and project_members.role = 'owner'
    )
  );

create policy "Members can view project members"
  on public.project_members for select
  using (
    exists (
      select 1 from public.project_members as pm
      where pm.project_id = project_members.project_id
      and pm.user_id = auth.uid()
    )
  );

create policy "Owners can add members"
  on public.project_members for insert
  with check (
    exists (
      select 1 from public.project_members as pm
      where pm.project_id = project_members.project_id
      and pm.user_id = auth.uid()
      and pm.role = 'owner'
    )
    or (user_id = auth.uid() and role = 'owner')
  );

create policy "Owners can remove members"
  on public.project_members for delete
  using (
    exists (
      select 1 from public.project_members as pm
      where pm.project_id = project_members.project_id
      and pm.user_id = auth.uid()
      and pm.role = 'owner'
    )
  );
