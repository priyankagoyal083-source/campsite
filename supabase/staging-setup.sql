-- Campsite: full schema setup (run once on a fresh Supabase project)
-- Generated from supabase/migrations/001-008

-- ============================================
-- 001_profiles.sql
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  email text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- 002_projects.sql
-- ============================================
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

-- ============================================
-- 003_todos.sql
-- ============================================
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

-- ============================================
-- 004_messages.sql
-- ============================================
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

-- ============================================
-- 005_invitations.sql
-- ============================================
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  email text not null,
  invited_by uuid references public.profiles(id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '7 days'
);

alter table public.invitations enable row level security;

create policy "Owners can create invitations"
  on public.invitations for insert
  with check (
    exists (
      select 1 from public.project_members
      where project_members.project_id = invitations.project_id
      and project_members.user_id = auth.uid()
      and project_members.role = 'owner'
    )
  );

create policy "Members can view invitations"
  on public.invitations for select
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = invitations.project_id
      and project_members.user_id = auth.uid()
    )
  );

create policy "Owners can update invitations"
  on public.invitations for update
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = invitations.project_id
      and project_members.user_id = auth.uid()
      and project_members.role = 'owner'
    )
  );

-- ============================================
-- 006_todo_comments.sql
-- ============================================
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

-- ============================================
-- 007_notifications.sql
-- ============================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Authenticated users can create notifications"
  on public.notifications for insert
  with check (auth.uid() is not null);

create policy "Users can delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- ============================================
-- 008_admin.sql
-- ============================================
alter table public.profiles add column if not exists is_admin boolean default false;

