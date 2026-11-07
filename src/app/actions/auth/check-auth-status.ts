"use server";

import { createAuthClient } from "@/utils/supabase/auth-server";

export async function checkAuthStatusAction() {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    isAuthenticated: Boolean(user),
    isAnonymous: Boolean(user?.app_metadata?.provider === "anonymous" || user?.is_anonymous),
    userId: user?.id ?? null,
  };
}


