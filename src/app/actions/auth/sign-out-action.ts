"use server";

import { redirect } from "next/navigation";

import { createAuthClient } from "@/utils/supabase/auth-server";

export const signOutAction = async () => {
  const supabase = await createAuthClient();
  await supabase.auth.signOut({ scope: "local" });
  return redirect("/login");
};
