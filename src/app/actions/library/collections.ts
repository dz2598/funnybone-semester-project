"use server";

import { createClient } from "@/utils/supabase/server";
import { fetchCaptionCards, type LibraryCaption } from "./caption-cards";

export type MemeCollection = {
  id: string;
  name: string;
  created_at: string;
  item_count: number;
};

async function getUserAndDb() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to manage collections.");
  return { user, db: supabase as any };
}

export async function fetchCollectionsAction(): Promise<MemeCollection[]> {
  const { user, db } = await getUserAndDb();
  const { data, error } = await db
    .from("meme_collections")
    .select("id, name, created_at, meme_collection_items(id)")
    .eq("profile_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    created_at: row.created_at,
    item_count: row.meme_collection_items?.length ?? 0,
  }));
}

export async function createCollectionAction(name: string) {
  const cleanName = name.trim();
  if (!cleanName || cleanName.length > 60) throw new Error("Enter a name up to 60 characters.");
  const { user, db } = await getUserAndDb();
  const { error } = await db.from("meme_collections").insert({ profile_id: user.id, name: cleanName });
  if (error) throw new Error(error.code === "23505" ? "A collection with this name already exists." : error.message);
}

export async function renameCollectionAction(id: string, name: string) {
  const cleanName = name.trim();
  if (!cleanName || cleanName.length > 60) throw new Error("Enter a name up to 60 characters.");
  const { user, db } = await getUserAndDb();
  const { error } = await db.from("meme_collections")
    .update({ name: cleanName, updated_at: new Date().toISOString() })
    .eq("id", id).eq("profile_id", user.id);
  if (error) throw new Error(error.message);
}

export async function deleteCollectionAction(id: string) {
  const { user, db } = await getUserAndDb();
  const { error } = await db.from("meme_collections").delete().eq("id", id).eq("profile_id", user.id);
  if (error) throw new Error(error.message);
}

export async function addCaptionToCollectionAction(collectionId: string, captionId: string) {
  const { user, db } = await getUserAndDb();
  const { data: collection } = await db.from("meme_collections").select("id")
    .eq("id", collectionId).eq("profile_id", user.id).maybeSingle();
  if (!collection) throw new Error("Collection not found.");
  const { error } = await db.from("meme_collection_items").upsert(
    { collection_id: collectionId, caption_id: captionId },
    { onConflict: "collection_id,caption_id" }
  );
  if (error) throw new Error(error.message);
}

export async function removeCaptionFromCollectionAction(collectionId: string, captionId: string) {
  const { db } = await getUserAndDb();
  const { error } = await db.from("meme_collection_items").delete()
    .eq("collection_id", collectionId).eq("caption_id", captionId);
  if (error) throw new Error(error.message);
}

export async function fetchCollectionCaptionsAction(collectionId: string): Promise<LibraryCaption[]> {
  const { user, db } = await getUserAndDb();
  const { data: collection } = await db.from("meme_collections").select("id")
    .eq("id", collectionId).eq("profile_id", user.id).maybeSingle();
  if (!collection) throw new Error("Collection not found.");
  const { data, error } = await db.from("meme_collection_items").select("caption_id")
    .eq("collection_id", collectionId).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return fetchCaptionCards((data ?? []).map((row: any) => row.caption_id));
}
