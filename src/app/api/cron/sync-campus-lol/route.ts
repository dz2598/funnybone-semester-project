import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type SourceMeme = {
  id: number;
  image_url: string;
  caption: string;
  prompt: string | null;
  user_id: string | null;
  created_at: string;
};

type SourceVote = {
  id: number;
  meme_id: number;
  user_id: string;
  vote_value: number;
  created_at: string;
};

function deterministicUuid(value: string) {
  const bytes = Buffer.from(createHash("sha256").update(value).digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function readAll<T>(client: SupabaseClient<any>, table: string) {
  const rows: T[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client
      .from(table)
      .select("*")
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Could not read ${table}: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < pageSize) return rows;
  }
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sourceUrl = process.env.CAMPUS_LOL_SUPABASE_URL;
  const sourceKey = process.env.CAMPUS_LOL_SUPABASE_PUBLISHABLE_KEY;
  const targetUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const targetKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!sourceUrl || !sourceKey || !targetUrl || !targetKey) {
    return NextResponse.json({ error: "Sync environment is incomplete" }, { status: 500 });
  }

  try {
    const source = createClient(sourceUrl, sourceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const target = createClient(targetUrl, targetKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const [memes, votes] = await Promise.all([
      readAll<SourceMeme>(source, "memes"),
      readAll<SourceVote>(source, "votes"),
    ]);
    const memeIds = new Set(memes.map((meme) => meme.id));

    const normalizedMemes = memes.map((meme) => ({
      source_meme_id: meme.id,
      source_user_id: meme.user_id,
      image_id: deterministicUuid(`campus-lol:image:${meme.id}`),
      caption_id: deterministicUuid(`campus-lol:caption:${meme.id}`),
      image_url: meme.image_url,
      caption: meme.caption,
      prompt: meme.prompt,
      created_at: meme.created_at,
    }));
    const normalizedVotes = votes
      .filter((vote) => memeIds.has(vote.meme_id))
      .map((vote) => ({
        source_vote_id: vote.id,
        source_user_id: vote.user_id,
        caption_id: deterministicUuid(`campus-lol:caption:${vote.meme_id}`),
        vote_value: vote.vote_value,
        created_at: vote.created_at,
      }));

    const { data, error } = await target.rpc("sync_campus_lol_snapshot", {
      p_secret: cronSecret,
      p_memes: normalizedMemes,
      p_votes: normalizedVotes,
    });
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, result: data });
  } catch (error) {
    console.error("Campus LOL sync failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 },
    );
  }
}
