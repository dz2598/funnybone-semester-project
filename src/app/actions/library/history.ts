"use server";

import { createClient } from "@/utils/supabase/server";
import { fetchCaptionCards, type LibraryCaption } from "./caption-cards";

export async function recordCaptionViewAction(captionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) return;
  const db = supabase as any;
  await db.from("recently_viewed_captions").upsert(
    { profile_id: user.id, caption_id: captionId, viewed_at: new Date().toISOString() },
    { onConflict: "profile_id,caption_id" }
  );
}

export async function fetchRecentCaptionsAction(): Promise<LibraryCaption[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) return [];
  const db = supabase as any;
  const { data, error } = await db.from("recently_viewed_captions")
    .select("caption_id").eq("profile_id", user.id)
    .order("viewed_at", { ascending: false }).limit(50);
  if (error) throw new Error(error.message);
  return fetchCaptionCards((data ?? []).map((row: any) => row.caption_id));
}

export async function clearRecentCaptionsAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await (supabase as any).from("recently_viewed_captions").delete().eq("profile_id", user.id);
  if (error) throw new Error(error.message);
}
