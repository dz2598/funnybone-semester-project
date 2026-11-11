import { fetchPopularCaptionsAction } from "@/app/actions/captions/fetch-popular-captions-action";
import type { MyMemesSection } from "@/app/actions/captions/fetch-popular-captions-action";
import { fetchUserCaptionVotesAction } from "@/app/actions/captions";
import { checkAuthStatusAction } from "@/app/actions/auth/check-auth-status";
import PopularCaptionsPageClient from "@/components/popular-captions-page-client";
import { redirect } from "next/navigation";
import {
  fetchMyMemeStatsAction,
  fetchUserProfileAction,
} from "@/app/actions/profile";

type PopularCaptionsFilter = "all" | "year" | "past30" | "week";

type PopularCaption = {
  id: string;
  content: string;
  image_url: string;
  like_count: number;
  upvote_count: number;
  downvote_count: number;
  is_common_use: boolean;
  created_at: string;
};

interface PopularCaptionsPageProps {
  initialFilter?: PopularCaptionsFilter;
  pastWeekHref?: string;
  pastMonthHref?: string;
  pastYearHref?: string;
  allTimeHref?: string;
  initialSection?: MyMemesSection;
}

export default async function PopularCaptionsPage({
  initialFilter = "all",
  pastWeekHref,
  pastMonthHref,
  pastYearHref,
  allTimeHref,
  initialSection = "liked",
}: PopularCaptionsPageProps) {
  const auth = await checkAuthStatusAction();
  const isAuthenticated = auth.isAuthenticated && !auth.isAnonymous;

  if (!isAuthenticated) {
    redirect("/login");
  }

  const [captions, profile, stats] = await Promise.all([
    fetchPopularCaptionsAction(100, initialFilter, initialSection) as Promise<PopularCaption[]>,
    fetchUserProfileAction(),
    fetchMyMemeStatsAction(),
  ]);

  let initialUserVotes: Record<string, 1 | -1 | null> = {};
  if (isAuthenticated && captions.length > 0) {
    const captionIds = captions.map((caption) => caption.id);
    initialUserVotes = await fetchUserCaptionVotesAction(captionIds);
  }

  return (
    <PopularCaptionsPageClient
      initialFilter={initialFilter}
      pastWeekHref={pastWeekHref}
      pastMonthHref={pastMonthHref}
      pastYearHref={pastYearHref}
      allTimeHref={allTimeHref}
      initialCaptions={captions}
      initialUserVotes={initialUserVotes}
      initialIsAuthenticated={isAuthenticated}
      initialSection={initialSection}
      profileSummary={{
        name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email,
        avatarUrl: profile.avatar_url,
        posts: stats.posts,
        likes: stats.likes,
      }}
    />
  );
}
