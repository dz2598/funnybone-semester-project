"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { checkAuthStatusAction } from "@/app/actions/auth/check-auth-status";
import { clearRecentCaptionsAction, fetchRecentCaptionsAction, type LibraryCaption } from "@/app/actions/library";
import { LibraryCaptionGrid } from "@/components/library-caption-grid";
import { useToast } from "@/hooks/use-toast";

export default function RecentPage() {
  const [captions, setCaptions] = useState<LibraryCaption[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const { toast } = useToast();
  useEffect(() => {
    checkAuthStatusAction().then((auth) => {
      const active = auth.isAuthenticated && !auth.isAnonymous;
      setSignedIn(active);
      if (!active) return;
      return fetchRecentCaptionsAction().then(setCaptions);
    }).catch((error) => toast({ title: "Could not load history", description: error.message }))
      .finally(() => setLoading(false));
  }, []);

  const clear = async () => {
    await clearRecentCaptionsAction();
    setCaptions([]);
    setConfirmingClear(false);
  };

  if (signedIn === false) {
    return <div className="py-20 text-center"><h1 className="text-3xl font-bold">Recently Viewed</h1><p className="mt-3 text-muted-foreground">Log in to keep a private history of captions you open.</p><Link href="/login" className="mt-6 inline-flex rounded-lg bg-primary px-5 py-2.5 text-primary-foreground">Log in</Link></div>;
  }

  return <div className="py-8 space-y-8">
    <header className="flex items-end justify-between gap-4"><div><p className="text-sm uppercase tracking-widest text-primary">Browsing history</p><h1 className="text-3xl font-bold">Recently Viewed</h1><p className="text-muted-foreground mt-2">Return to captions you opened recently.</p></div>{captions.length > 0 && (confirmingClear ? <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Clear all history?</span><button onClick={() => void clear()} className="px-3 py-2 border border-destructive text-destructive rounded-lg">Clear</button><button onClick={() => setConfirmingClear(false)} className="px-3 py-2 border rounded-lg">Cancel</button></div> : <button onClick={() => setConfirmingClear(true)} className="px-4 py-2 border rounded-lg hover:text-destructive">Clear history</button>)}</header>
    {loading ? <p className="text-muted-foreground">Loading history…</p> : <LibraryCaptionGrid captions={captions} emptyTitle="No viewing history yet" emptyDescription="Open a caption and it will appear here." />}
  </div>;
}
