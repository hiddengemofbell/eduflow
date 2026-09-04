create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

alter table public.users
  rename column password to legacy_password;

alter table public.users
  alter column legacy_password drop not null,
  add column auth_user_id uuid unique references auth.users(id) on delete cascade;

comment on column public.users.legacy_password is
  'Temporary bcrypt hash for accounts created before Supabase Auth; cleared when the email is linked.';

comment on column public.users.auth_user_id is
  'Supabase Auth identity. Nullable only for legacy accounts awaiting activation.';

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  normalized_name text := btrim(coalesce(new.raw_user_meta_data ->> 'name', ''));
  normalized_email text := lower(btrim(coalesce(new.email, '')));
  requested_type text := upper(btrim(coalesce(new.raw_user_meta_data ->> 'account_type', 'INDIVIDUAL')));
  normalized_join_code text := upper(btrim(coalesce(new.raw_user_meta_data ->> 'join_code', '')));
  normalized_org_name text := btrim(coalesce(new.raw_user_meta_data ->> 'org_name', ''));
  resolved_type text;
  resolved_organization_id bigint;
  existing_profile_id bigint;
  generated_join_code text;
  attempt integer;
begin
  if normalized_email = '' then
    raise exception 'EduFlow requires an email identity.';
  end if;

  select id
    into existing_profile_id
    from public.users
    where email = normalized_email
      and auth_user_id is null
    for update;

  if existing_profile_id is not null then
    update public.users
      set auth_user_id = new.id,
          legacy_password = null,
          updated_at = now()
      where id = existing_profile_id;
    return new;
  end if;

  if normalized_name = '' or char_length(normalized_name) > 100 then
    raise exception 'A profile name between 1 and 100 characters is required.';
  end if;

  if requested_type not in ('INDIVIDUAL', 'ORG_ADMIN', 'ORG_MEMBER') then
    raise exception 'Invalid EduFlow account type.';
  end if;

  if normalized_join_code <> '' then
    if normalized_join_code !~ '^[A-F0-9]{8}$' then
      raise exception 'Invalid EduFlow organization join code.';
    end if;

    select id
      into resolved_organization_id
      from public.organizations
      where join_code = normalized_join_code;

    if resolved_organization_id is null then
      raise exception 'Invalid EduFlow organization join code.';
    end if;

    resolved_type := 'ORG_MEMBER';
  else
    if requested_type = 'ORG_MEMBER' then
      raise exception 'Organization members must provide a join code.';
    end if;
    resolved_type := requested_type;
  end if;

  if resolved_type = 'ORG_ADMIN' and char_length(normalized_org_name) > 150 then
    raise exception 'Organization name must be between 1 and 150 characters.';
  end if;

  insert into public.users (
    auth_user_id,
    name,
    email,
    account_type,
    organization_id,
    legacy_password
  ) values (
    new.id,
    normalized_name,
    normalized_email,
    resolved_type,
    resolved_organization_id,
    null
  )
  returning id into existing_profile_id;

  if resolved_type = 'ORG_ADMIN' and normalized_org_name <> '' then
    for attempt in 1..10 loop
      generated_join_code := upper(substr(encode(extensions.gen_random_bytes(5), 'hex'), 1, 8));
      begin
        insert into public.organizations (name, join_code, created_by)
        values (normalized_org_name, generated_join_code, existing_profile_id)
        returning id into resolved_organization_id;
        exit;
      exception when unique_violation then
        resolved_organization_id := null;
      end;
    end loop;

    if resolved_organization_id is null then
      raise exception 'Unable to generate a unique organization join code.';
    end if;

    update public.users
      set organization_id = resolved_organization_id,
          updated_at = now()
      where id = existing_profile_id;
  end if;

  return new;
end;
$function$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();
