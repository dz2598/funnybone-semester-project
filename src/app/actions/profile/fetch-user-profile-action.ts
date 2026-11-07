"use server";

import { createAuthClient } from "@/utils/supabase/auth-server";

export const fetchUserProfileAction = async () => {
  const supabase = await createAuthClient();

  // Get the current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not found.");
  }

  // Funnybone shares the Humor Project login. Do not depend on Crackd's old
  // public profile schema here: the authenticated user is the canonical source.
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
    email: user.email ?? "",
    provider: String(user.app_metadata?.provider ?? ""),
    dorm: String(metadata.dorm ?? ""),
    school: String(metadata.school ?? ""),
    major: String(metadata.major ?? ""),
    class_year: String(metadata.class_year ?? ""),
  };
};
