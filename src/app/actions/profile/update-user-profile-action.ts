"use server";

import { createClient } from "@/utils/supabase/server";

export const updateUserProfileAction = async (
  firstName: string,
  lastName: string
) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not found.");
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: {
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`.trim(),
    },
  });

  if (authError) {
    throw new Error("Failed to update profile.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      modified_by_user_id: user.id,
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error || !data) {
    // Humor Project can use a different public profile schema. Auth metadata
    // has already been updated successfully, so return a compatible profile.
    if (error) console.warn("Profile table update skipped:", error.message);
    return {
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      email: user.email,
      created_datetime_utc: user.created_at,
      modified_datetime_utc: new Date().toISOString(),
    };
  }

  // Return the profile data along with the user's email
  return {
    ...data,
    email: user.email,
  };
};
