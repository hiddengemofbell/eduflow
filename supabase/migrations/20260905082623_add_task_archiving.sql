alter table public.tasks
  add column if not exists is_archived boolean not null default false;

alter table public.tasks
  add constraint tasks_archived_only_when_completed
  check (is_archived = false or status = 'COMPLETED');

create index if not exists tasks_is_archived_idx on public.tasks(is_archived);
