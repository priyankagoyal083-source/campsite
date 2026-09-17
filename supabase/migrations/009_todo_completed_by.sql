alter table public.todos
  add column if not exists completed_by uuid references public.profiles(id) on delete set null;
