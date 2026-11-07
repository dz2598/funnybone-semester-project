-- Remove the bundled teaching archive from the public meme experience.
-- Keep schema, authentication, model configuration, and only the Campus LOL
-- rows synchronized from the user's Humor Project Supabase instance.

begin;

create temporary table campus_lol_images on commit drop as
select id
from public.images
where url like 'https://erivhrwjfmjhcehbmmgd.supabase.co/%';

create temporary table campus_lol_votes on commit drop as
select v.*
from public.caption_votes v
join public.captions c on c.id = v.caption_id
where c.image_id in (select id from campus_lol_images);

-- The archive has hundreds of thousands of votes. Preserve the Campus LOL
-- subset around a truncate to avoid expensive per-row vote triggers.
truncate table public.caption_votes;

insert into public.caption_votes
select * from campus_lol_votes;

-- Clear caption children explicitly before their parents. This is equivalent
-- to the existing cascade behavior but much faster for the teaching archive.
delete from public.reported_captions x using public.captions c
where x.caption_id = c.id and c.image_id not in (select id from campus_lol_images);
delete from public.study_caption_navigation_events x using public.captions c
where x.caption_id = c.id and c.image_id not in (select id from campus_lol_images);
delete from public.study_caption_vote_events x using public.captions c
where x.caption_id = c.id and c.image_id not in (select id from campus_lol_images);
delete from public.caption_saves x using public.captions c
where x.caption_id = c.id and c.image_id not in (select id from campus_lol_images);
delete from public.meme_collection_items x using public.captions c
where x.caption_id = c.id and c.image_id not in (select id from campus_lol_images);
delete from public.recently_viewed_captions x using public.captions c
where x.caption_id = c.id and c.image_id not in (select id from campus_lol_images);
delete from public.screenshots x using public.captions c
where x.caption_id = c.id and c.image_id not in (select id from campus_lol_images);
delete from public.shares x using public.captions c
where x.caption_id = c.id and c.image_id not in (select id from campus_lol_images);
delete from public.study_caption_mappings x using public.captions c
where x.caption_id = c.id and c.image_id not in (select id from campus_lol_images);

delete from public.captions
where image_id not in (select id from campus_lol_images);

-- Clear image children, including the NO ACTION relationships, before
-- removing the teaching images themselves.
delete from public.caption_generation_tasks where image_id not in (select id from campus_lol_images);
delete from public.image_humor_potential_scores where image_id not in (select id from campus_lol_images);
delete from public.caption_examples where image_id not in (select id from campus_lol_images);
delete from public.caption_requests where image_id not in (select id from campus_lol_images);
delete from public.common_use_category_image_mappings where image_id not in (select id from campus_lol_images);
delete from public.image_content_hashes where image_id not in (select id from campus_lol_images);
delete from public.image_reaction_profiles where image_id not in (select id from campus_lol_images);
delete from public.reported_images where image_id not in (select id from campus_lol_images);
delete from public.study_image_set_image_mappings where image_id not in (select id from campus_lol_images);

delete from public.images
where id not in (select id from campus_lol_images);

do $$
begin
  if (select count(*) from public.images) <> 15
    or (select count(*) from public.captions) <> 15
    or (select count(*) from public.caption_votes) <> 8 then
    raise exception 'Unexpected Campus LOL content counts after cleanup';
  end if;

  if exists (
    select 1 from public.images
    where url not like 'https://erivhrwjfmjhcehbmmgd.supabase.co/%'
  ) then
    raise exception 'Teaching images remain after cleanup';
  end if;
end;
$$;

commit;
