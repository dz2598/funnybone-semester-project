create extension if not exists pgcrypto;

create or replace function public.campus_lol_target_profile(
  source_user_id uuid,
  for_vote boolean default false
)
returns uuid
language sql
immutable
as $$
  select case source_user_id
    when '3c9e608b-a43c-4b53-aea9-1bb21472f908'::uuid then '007ff674-8b0c-411d-9009-e27a6417c08f'::uuid
    when 'ac0622b8-1cfa-45c6-b2f8-fc1446d22e31'::uuid then '0132ab38-4061-4538-a418-d9b360828174'::uuid
    when 'dc19f508-7fe9-48be-bb58-d5c16a62bfe2'::uuid then '01ae41e4-526f-49e5-ba34-daeac4630162'::uuid
    else case when for_vote
      then '028340ef-88cb-4cb3-a02b-e35ed00be302'::uuid
      else '002ff29d-2af5-4784-8d0f-36652ae69b42'::uuid
    end
  end;
$$;

create or replace function public.sync_campus_lol_snapshot(
  p_secret text,
  p_memes jsonb,
  p_votes jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  expected_hash constant text := 'd8c615d306eef929c517b0a4e2bb05e8cc031d8251245e052f3b1efb2f883984';
  meme_count integer;
  vote_count integer;
begin
  if encode(extensions.digest(convert_to(coalesce(p_secret, ''), 'UTF8'), 'sha256'), 'hex') <> expected_hash then
    raise exception 'Unauthorized Campus LOL sync';
  end if;

  create temporary table campus_memes on commit drop as
  select *
  from jsonb_to_recordset(coalesce(p_memes, '[]'::jsonb)) as x(
    source_meme_id bigint,
    source_user_id uuid,
    image_id uuid,
    caption_id uuid,
    image_url text,
    caption text,
    prompt text,
    created_at timestamptz
  );

  create temporary table campus_votes on commit drop as
  select *
  from jsonb_to_recordset(coalesce(p_votes, '[]'::jsonb)) as x(
    source_vote_id bigint,
    source_user_id uuid,
    caption_id uuid,
    vote_value integer,
    created_at timestamptz
  );

  insert into public.images (
    id, profile_id, created_by_user_id, modified_by_user_id, url,
    additional_context, is_public, is_common_use,
    created_datetime_utc, modified_datetime_utc
  )
  select
    image_id,
    public.campus_lol_target_profile(source_user_id),
    public.campus_lol_target_profile(source_user_id),
    public.campus_lol_target_profile(source_user_id),
    image_url, prompt, true, false, created_at, created_at
  from campus_memes
  on conflict (id) do update set
    url = excluded.url,
    additional_context = excluded.additional_context,
    is_public = true,
    modified_datetime_utc = excluded.modified_datetime_utc;

  insert into public.captions (
    id, profile_id, created_by_user_id, modified_by_user_id, image_id, content,
    is_public, is_featured, like_count,
    created_datetime_utc, modified_datetime_utc
  )
  select
    caption_id,
    public.campus_lol_target_profile(source_user_id),
    public.campus_lol_target_profile(source_user_id),
    public.campus_lol_target_profile(source_user_id),
    image_id, caption, true, false, 0, created_at, created_at
  from campus_memes
  on conflict (id) do update set
    content = excluded.content,
    image_id = excluded.image_id,
    is_public = true,
    modified_datetime_utc = excluded.modified_datetime_utc;

  delete from public.caption_votes existing
  using campus_memes imported
  where existing.caption_id = imported.caption_id
    and existing.created_by_user_id in (
      '007ff674-8b0c-411d-9009-e27a6417c08f'::uuid,
      '0132ab38-4061-4538-a418-d9b360828174'::uuid,
      '01ae41e4-526f-49e5-ba34-daeac4630162'::uuid,
      '028340ef-88cb-4cb3-a02b-e35ed00be302'::uuid
    );

  insert into public.caption_votes (
    profile_id, created_by_user_id, modified_by_user_id, caption_id, vote_value,
    is_from_study, created_datetime_utc, modified_datetime_utc
  )
  select
    public.campus_lol_target_profile(source_user_id, true),
    public.campus_lol_target_profile(source_user_id, true),
    public.campus_lol_target_profile(source_user_id, true),
    caption_id, vote_value, false, created_at, created_at
  from campus_votes;

  select count(*) into meme_count from campus_memes;
  select count(*) into vote_count from campus_votes;
  return jsonb_build_object('memes', meme_count, 'votes', vote_count);
end;
$$;

revoke all on function public.sync_campus_lol_snapshot(text, jsonb, jsonb) from public;
grant execute on function public.sync_campus_lol_snapshot(text, jsonb, jsonb) to anon;
grant execute on function public.sync_campus_lol_snapshot(text, jsonb, jsonb) to authenticated;
