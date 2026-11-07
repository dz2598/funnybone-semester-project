"use server";

import { createAuthClient } from "@/utils/supabase/auth-server";

export const updateUserProfileAction = async (
  firstName: string,
  lastName: string,
  dorm: string,
  school: string,
  major: string,
  classYear: string
) => {
  const supabase = await createAuthClient();

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
      dorm,
      school,
      major,
      class_year: classYear,
    },
  });

  if (authError) {
    throw new Error("Failed to update profile.");
  }

  return {
    id: user.id,
    first_name: firstName,
    last_name: lastName,
    email: user.email ?? "",
    created_datetime_utc: user.created_at,
    modified_datetime_utc: new Date().toISOString(),
    dorm,
    school,
    major,
    class_year: classYear,
  };
};
