import { NextResponse } from "next/server";

import { createAuthClient } from "@/utils/supabase/auth-server";

export const GET = async (request: Request) => {
  const requestUrl = new URL(request.url);
  const origin =
    process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_BASE_URL
      ? process.env.NEXT_PUBLIC_BASE_URL
      : requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const providerError = requestUrl.searchParams.get("error_description");

  if (providerError || !code) {
    const message = providerError || "Authentication code missing";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`
    );
  }

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Humor Project OAuth callback failed:", error);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  const redirectTo = requestUrl.searchParams.get("redirect_to");
  const safeRedirect = redirectTo?.startsWith("/") ? redirectTo : "/";
  return NextResponse.redirect(`${origin}${safeRedirect}`);
};
