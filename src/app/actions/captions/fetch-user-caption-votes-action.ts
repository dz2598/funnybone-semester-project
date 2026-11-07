"use server";

import { createAuthClient } from "@/utils/supabase/auth-server";

export const fetchUserCaptionVotesAction = async (
  captionIds: string[]
): Promise<Record<string, 1 | -1 | null>> => {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result: Record<string, 1 | -1 | null> = Object.fromEntries(
    captionIds.map((id) => [id, null])
  );
  if (!user || captionIds.length === 0) return result;

  const memeIds = captionIds
    .map(Number)
    .filter((id) => Number.isSafeInteger(id));
  const { data, error } = await supabase
    .from("votes")
    .select("meme_id, vote_value, created_at")
    .eq("user_id", user.id)
    .in("meme_id", memeIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Could not load Humor Project votes:", error);
    return result;
  }

  for (const vote of data ?? []) {
    const id = String(vote.meme_id);
    if (result[id] !== null) continue;
    const value = Number(vote.vote_value);
    if (value === 1 || value === -1) result[id] = value;
  }
  return result;
};
