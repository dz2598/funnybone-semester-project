"use server";

import { createAuthClient } from "@/utils/supabase/auth-server";

type Period = "all" | "year" | "past30" | "week";
export type MyMemesSection = "liked" | "published";

type HumorProjectMeme = {
  id: number;
  image_url: string;
  caption: string | null;
  created_at: string;
};

type HumorProjectVote = {
  meme_id: number;
  vote_value: number;
};

export const fetchPopularCaptionsAction = async (
  limit = 100,
  period: Period = "all",
  section: MyMemesSection = "liked"
) => {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) return [];

  let likedMemeIds: number[] | null = null;
  if (section === "liked") {
    const { data: likedVotes, error: likedVotesError } = await supabase
      .from("votes")
      .select("meme_id, created_at")
      .eq("user_id", user.id)
      .eq("vote_value", 1)
      .order("created_at", { ascending: false });

    if (likedVotesError) {
      throw new Error(`Failed to load your liked memes: ${likedVotesError.message}`);
    }

    likedMemeIds = Array.from(
      new Set((likedVotes ?? []).map((vote) => Number(vote.meme_id)))
    ).filter(Number.isSafeInteger);
    if (likedMemeIds.length === 0) return [];
  }

  let query = supabase
    .from("memes")
    .select("id, image_url, caption, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  query = section === "published"
    ? query.eq("user_id", user.id)
    : query.in("id", likedMemeIds ?? []);

  if (period !== "all") {
    const since = new Date();
    if (period === "year") since.setFullYear(since.getFullYear() - 1);
    if (period === "past30") since.setDate(since.getDate() - 30);
    if (period === "week") since.setDate(since.getDate() - 7);
    query = query.gte("created_at", since.toISOString());
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load your Humor Project memes: ${error.message}`);

  const memes = (data ?? []) as HumorProjectMeme[];
  if (memes.length === 0) return [];

  const memeIds = memes.map((meme) => meme.id);
  const { data: voteRows, error: voteError } = await supabase
    .from("votes")
    .select("meme_id, vote_value")
    .in("meme_id", memeIds);

  if (voteError) {
    console.error("Could not load Humor Project vote totals:", voteError);
  }

  const totals = new Map<number, number>();
  const upvoteCounts = new Map<number, number>();
  const downvoteCounts = new Map<number, number>();
  for (const vote of (voteRows ?? []) as HumorProjectVote[]) {
    const value = Number(vote.vote_value);
    totals.set(vote.meme_id, (totals.get(vote.meme_id) ?? 0) + value);
    if (value === 1) {
      upvoteCounts.set(vote.meme_id, (upvoteCounts.get(vote.meme_id) ?? 0) + 1);
    } else if (value === -1) {
      downvoteCounts.set(vote.meme_id, (downvoteCounts.get(vote.meme_id) ?? 0) + 1);
    }
  }

  return memes.map((meme) => ({
    id: String(meme.id),
    content: meme.caption ?? "",
    image_id: String(meme.id),
    image_url: meme.image_url,
    like_count: totals.get(meme.id) ?? 0,
    upvote_count: upvoteCounts.get(meme.id) ?? 0,
    downvote_count: downvoteCounts.get(meme.id) ?? 0,
    is_common_use: false,
    created_at: meme.created_at,
  }));
};
