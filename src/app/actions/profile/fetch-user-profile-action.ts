"use server";

import { createClient } from "@/utils/supabase/server";

export const fetchUserProfileAction = async () => {
  const supabase = await createClient();

  // Get the current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not found.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, created_datetime_utc, modified_datetime_utc")
    .eq("id", user.id)
    .maybeSingle();

  if (data && !error) {
    return data;
  }

  // The companion app shares Humor Project authentication, but that project
  // may use a different public profile schema. Auth metadata is the canonical
  // fallback and is always scoped to the current signed-in user.
  if (error) {
    console.warn("Using auth metadata for profile:", error.message);
  }

  const metadata = user.user_metadata ?? {};
  const fullName = String(metadata.full_name ?? metadata.name ?? "").trim();
  const nameParts = fullName.split(/\s+/).filter(Boolean);

  return {
    id: user.id,
    first_name: metadata.first_name ?? metadata.given_name ?? nameParts[0] ?? null,
    last_name:
      metadata.last_name ?? metadata.family_name ??
      (nameParts.length > 1 ? nameParts.slice(1).join(" ") : null),
    created_datetime_utc: user.created_at,
    modified_datetime_utc: user.updated_at ?? user.created_at,
  };
};
