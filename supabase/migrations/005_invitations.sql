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
