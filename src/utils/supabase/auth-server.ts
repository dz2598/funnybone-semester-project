import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseAuthCookieOptions } from "@/utils/supabase/authCookies";

/**
 * Authentication is shared with Campus LOL / Humor Project.
 * Funnybone's imported teaching database remains a separate data source.
 */
export const createAuthClient = async () => {
  const cookieStore = await cookies();
  const url = process.env.CAMPUS_LOL_SUPABASE_URL;
  const key = process.env.CAMPUS_LOL_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing CAMPUS_LOL_SUPABASE_URL or CAMPUS_LOL_SUPABASE_PUBLISHABLE_KEY"
    );
  }

  return createServerClient(url, key, {
    cookieOptions: getSupabaseAuthCookieOptions(url),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies. Middleware and route
          // handlers refresh the session when a response can set cookies.
        }
      },
    },
  });
};
