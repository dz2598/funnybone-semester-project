-- Secure the restored teaching database without exposing unused archive tables.
-- Existing table-specific policies remain in place; tables without a policy
-- become inaccessible through the public API after RLS is enabled.

begin;

do $$
declare
  relation record;
begin
  for relation in
    select n.nspname as schema_name, c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
  loop
    execute format(
      'alter table %I.%I enable row level security',
      relation.schema_name,
      relation.table_name
    );
  end loop;
end;
$$;

-- Public catalogue data used before authentication.
drop policy if exists "Public can read allowed signup domains"
  on public.allowed_signup_domains;
create policy "Public can read allowed signup domains"
  on public.allowed_signup_domains for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read dorms" on public.dorms;
create policy "Public can read dorms"
  on public.dorms for select
  to anon, authenticated
  using (true);

drop policy if exists "Anonymous users can view public captions"
  on public.captions;
create policy "Anonymous users can view public captions"
  on public.captions for select
  to anon
  using (
    is_public = true
    and exists (
      select 1
      from public.images
      where images.id = captions.image_id
        and (images.is_public = true or images.is_common_use = true)
    )
  );

drop policy if exists "Anonymous users can view common use categories"
  on public.common_use_categories;
create policy "Anonymous users can view common use categories"
  on public.common_use_categories for select
  to anon
  using (true);

drop policy if exists "Anonymous users can view common use mappings"
  on public.common_use_category_image_mappings;
create policy "Anonymous users can view common use mappings"
  on public.common_use_category_image_mappings for select
  to anon
  using (true);

-- Private user-owned data that did not have policies in the teaching copy.
drop policy if exists "Users manage their own caption saves"
  on public.caption_saves;
create policy "Users manage their own caption saves"
  on public.caption_saves for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists "Users manage their own dorm mapping"
  on public.profile_dorm_mappings;
create policy "Users manage their own dorm mapping"
  on public.profile_dorm_mappings for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists "Users manage their own caption votes"
  on public.caption_votes;
create policy "Users manage their own caption votes"
  on public.caption_votes for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Security-invoker views use the caller's RLS policies instead of the view
-- owner's elevated privileges. The application does not query archive views.
do $$
declare
  relation record;
begin
  for relation in
    select n.nspname as schema_name, c.relname as view_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'v'
  loop
    execute format(
      'alter view %I.%I set (security_invoker = true)',
      relation.schema_name,
      relation.view_name
    );
  end loop;
end;
$$;

commit;
