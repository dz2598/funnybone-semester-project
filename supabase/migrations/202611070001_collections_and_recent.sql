create table if not exists public.meme_collections (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, name)
);

create table if not exists public.meme_collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.meme_collections(id) on delete cascade,
  caption_id uuid not null references public.captions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (collection_id, caption_id)
);

create table if not exists public.recently_viewed_captions (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  caption_id uuid not null references public.captions(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (profile_id, caption_id)
);

alter table public.meme_collections enable row level security;
alter table public.meme_collection_items enable row level security;
alter table public.recently_viewed_captions enable row level security;

create policy "Users manage their own collections"
on public.meme_collections for all to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "Users read their own collection items"
on public.meme_collection_items for select to authenticated
using (exists (
  select 1 from public.meme_collections c
  where c.id = collection_id and c.profile_id = auth.uid()
));

create policy "Users add items to their own collections"
on public.meme_collection_items for insert to authenticated
with check (exists (
  select 1 from public.meme_collections c
  where c.id = collection_id and c.profile_id = auth.uid()
));

create policy "Users remove items from their own collections"
on public.meme_collection_items for delete to authenticated
using (exists (
  select 1 from public.meme_collections c
  where c.id = collection_id and c.profile_id = auth.uid()
));

create policy "Users manage their own viewing history"
on public.recently_viewed_captions for all to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create index if not exists meme_collections_profile_idx
  on public.meme_collections(profile_id, updated_at desc);
create index if not exists meme_collection_items_collection_idx
  on public.meme_collection_items(collection_id, created_at desc);
create index if not exists recently_viewed_profile_idx
  on public.recently_viewed_captions(profile_id, viewed_at desc);
