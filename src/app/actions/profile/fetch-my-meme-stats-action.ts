"use server";

import { createAuthClient } from "@/utils/supabase/auth-server";

const PAGE_SIZE = 1000;
const VOTE_COUNT_BATCH_SIZE = 100;

export const fetchMyMemeStatsAction = async () => {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) {
    return { posts: 0, likes: 0 };
  }

  const memeIds: number[] = [];
  let page = 0;

  while (true) {
    const { data, error } = await supabase
      .from("memes")
      .select("id")
      .eq("user_id", user.id)
      .order("id", { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Failed to load your post count: ${error.message}`);
    }

    const ids = (data ?? []).map((meme) => Number(meme.id));
    memeIds.push(...ids);
    if (ids.length < PAGE_SIZE) break;
    page += 1;
  }

  let likes = 0;
  for (let index = 0; index < memeIds.length; index += VOTE_COUNT_BATCH_SIZE) {
    const batch = memeIds.slice(index, index + VOTE_COUNT_BATCH_SIZE);
    const { count, error } = await supabase
      .from("votes")
      .select("meme_id", { count: "exact", head: true })
      .eq("vote_value", 1)
      .in("meme_id", batch);

    if (error) {
      throw new Error(`Failed to load likes received: ${error.message}`);
    }
    likes += count ?? 0;
  }

  return { posts: memeIds.length, likes };
};
