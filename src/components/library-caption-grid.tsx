"use client";

import Link from "next/link";
import { History } from "lucide-react";
import type { LibraryCaption } from "@/app/actions/library";

export function LibraryCaptionGrid({
  captions,
  emptyTitle,
  emptyDescription,
  onRemove,
}: {
  captions: LibraryCaption[];
  emptyTitle: string;
  emptyDescription: string;
  onRemove?: (captionId: string) => void;
}) {
  if (captions.length === 0) {
    return (
      <div className="py-20 text-center space-y-3 border border-dashed border-foreground/20 rounded-2xl">
        <History className="w-12 h-12 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-semibold">{emptyTitle}</h2>
        <p className="text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {captions.map((caption) => (
        <article key={caption.id} className="rounded-xl overflow-hidden border border-foreground/10 bg-card shadow-sm">
          <Link href={`/caption/${caption.id}`} className="block">
            <img
              src={caption.image_url}
              alt={caption.image_description || "Meme image"}
              className="w-full aspect-square object-cover bg-muted"
            />
            <div className="p-4">
              <p className="font-medium line-clamp-3">{caption.content}</p>
            </div>
          </Link>
          {onRemove && (
            <div className="px-4 pb-4">
              <button
                onClick={() => onRemove(caption.id)}
                className="text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                Remove from collection
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
