create index organizations_created_by_idx on public.organizations(created_by);
create index users_organization_id_idx on public.users(organization_id);

alter table public.tasks
  add constraint tasks_scope_matches_type_check
  check (
    (task_type = 'ORG' and organization_id is not null)
    or
    (task_type <> 'ORG' and organization_id is null and assigned_to is null)
  ),
  add constraint tasks_description_length_check
  check (char_length(description) <= 10000);
