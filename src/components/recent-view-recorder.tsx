"use client";

import { useEffect } from "react";
import { recordCaptionViewAction } from "@/app/actions/library";

export function RecentViewRecorder({ captionId }: { captionId: string }) {
  useEffect(() => {
    recordCaptionViewAction(captionId).catch(() => undefined);
  }, [captionId]);
  return null;
}
