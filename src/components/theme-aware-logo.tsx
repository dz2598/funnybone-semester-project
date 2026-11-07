import { createAuthClient } from "@/utils/supabase/auth-server";
import { ThemeAwareLogoClient } from "./theme-aware-logo-client";

export async function ThemeAwareLogo() {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;

  return <ThemeAwareLogoClient isAuthenticated={isAuthenticated} />;
}
