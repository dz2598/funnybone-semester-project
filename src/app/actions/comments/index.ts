"use server";

import { createAuthClient } from "@/utils/supabase/auth-server";

export type MemeComment = {
  id: number;
  meme_id: number;
  user_id: string;
  author_name: string;
  author_avatar_url: string | null;
  content: string;
  created_at: string;
  can_delete: boolean;
};

const requireUser = async () => {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) throw new Error("Please sign in to comment.");
  return { supabase, user };
};

export async function fetchMemeCommentsAction(memeId: string): Promise<MemeComment[]> {
  const numericMemeId = Number(memeId);
  if (!Number.isSafeInteger(numericMemeId)) throw new Error("Invalid meme ID.");

  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("meme_comments")
    .select("id, meme_id, user_id, author_name, author_avatar_url, content, created_at")
    .eq("meme_id", numericMemeId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to load comments: ${error.message}`);

  return (data ?? []).map((comment) => ({
    ...comment,
    can_delete: comment.user_id === user.id,
  })) as MemeComment[];
}

export async function createMemeCommentAction(
  memeId: string,
  rawContent: string
): Promise<MemeComment> {
  const numericMemeId = Number(memeId);
  const content = rawContent.trim();
  if (!Number.isSafeInteger(numericMemeId)) throw new Error("Invalid meme ID.");
  if (!content || content.length > 500) {
    throw new Error("Comments must be between 1 and 500 characters.");
  }

  const { supabase, user } = await requireUser();
  const metadata = user.user_metadata ?? {};
  const authorName = String(
    metadata.full_name ?? metadata.name ?? user.email?.split("@")[0] ?? "Campus user"
  ).trim();
  const authorAvatarUrl = String(metadata.avatar_url ?? metadata.picture ?? "").trim() || null;

  const { data, error } = await supabase
    .from("meme_comments")
    .insert({
      meme_id: numericMemeId,
      user_id: user.id,
      author_name: authorName,
      author_avatar_url: authorAvatarUrl,
      content,
    })
    .select("id, meme_id, user_id, author_name, author_avatar_url, content, created_at")
    .single();

  if (error) throw new Error(`Failed to post comment: ${error.message}`);
  return { ...data, can_delete: true } as MemeComment;
}

export async function deleteMemeCommentAction(commentId: number) {
  if (!Number.isSafeInteger(commentId)) throw new Error("Invalid comment ID.");
  const { supabase } = await requireUser();
  const { error } = await supabase.from("meme_comments").delete().eq("id", commentId);
  if (error) throw new Error(`Failed to delete comment: ${error.message}`);
}
