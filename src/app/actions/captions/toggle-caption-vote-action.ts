"use server";

import { createAuthClient } from "@/utils/supabase/auth-server";

export const toggleCaptionVoteAction = async (
  captionId: string,
  voteValue: 1 | -1
) => {
  const memeId = Number(captionId);
  if (!Number.isSafeInteger(memeId)) throw new Error("Invalid meme ID");

  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please log in first.");

  const { data: existing, error: readError } = await supabase
    .from("votes")
    .select("id, vote_value")
    .eq("meme_id", memeId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (readError) throw readError;

  const { error: deleteError } = await supabase
    .from("votes")
    .delete()
    .eq("meme_id", memeId)
    .eq("user_id", user.id);
  if (deleteError) throw deleteError;

  if (Number(existing?.vote_value) === voteValue) return null;

  const { data, error } = await supabase
    .from("votes")
    .insert({ meme_id: memeId, user_id: user.id, vote_value: voteValue })
    .select()
    .single();
  if (error) throw error;
  return data;
};
