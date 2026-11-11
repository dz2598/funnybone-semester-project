import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { Button } from "./ui/button";
import { UserHeaderMenu } from "./user-header-menu";

export default function AuthButton({ user }: { user: User | null }) {
  // Funnybone uses the existing Humor Project account; it does not create a
  // second account in this app.
  if (!user) {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant={"outline"}>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  // Anonymous users get both login and sign up buttons
  if (user.is_anonymous) {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant={"outline"}>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  // Authenticated users get the avatar dropdown
  const metadata = user.user_metadata ?? {};
  const avatarUrl = String(
    metadata.avatar_url ?? metadata.picture ?? metadata.profile_picture ?? ""
  ).trim();

  return <UserHeaderMenu email={user.email || ""} avatarUrl={avatarUrl} />;
}
