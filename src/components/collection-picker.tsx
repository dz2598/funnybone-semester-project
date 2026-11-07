"use client";

import { useEffect, useState } from "react";
import { FolderPlus } from "lucide-react";
import {
  addCaptionToCollectionAction,
  createCollectionAction,
  fetchCollectionsAction,
  type MemeCollection,
} from "@/app/actions/library";
import { useToast } from "@/hooks/use-toast";

export function CollectionPicker({ captionId }: { captionId: string }) {
  const [collections, setCollections] = useState<MemeCollection[]>([]);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const refresh = async () => setCollections(await fetchCollectionsAction());
  useEffect(() => { refresh().catch(() => undefined); }, []);

  const create = async () => {
    const name = window.prompt("Name your new collection");
    if (!name) return;
    try {
      await createCollectionAction(name);
      await refresh();
      toast({ title: "Collection created", description: `${name} is ready to use.` });
    } catch (error) {
      toast({ title: "Could not create collection", description: error instanceof Error ? error.message : "Try again." });
    }
  };

  const add = async (collection: MemeCollection) => {
    try {
      await addCaptionToCollectionAction(collection.id, captionId);
      setOpen(false);
      toast({ title: "Added to collection", description: `Saved to ${collection.name}.` });
    } catch (error) {
      toast({ title: "Could not add caption", description: error instanceof Error ? error.message : "Try again." });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="p-2 hover:bg-white/10 rounded transition-colors"
        aria-label="Add to collection"
        title="Add to collection"
      >
        <FolderPlus className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 bottom-full mb-2 w-60 rounded-xl border border-foreground/15 bg-background shadow-xl p-2 z-50">
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add to collection</p>
          {collections.map((collection) => (
            <button key={collection.id} onClick={() => add(collection)} className="w-full text-left px-2 py-2 rounded-lg hover:bg-accent">
              {collection.name}
            </button>
          ))}
          {collections.length === 0 && <p className="px-2 py-2 text-sm text-muted-foreground">No collections yet.</p>}
          <button onClick={create} className="w-full text-left px-2 py-2 mt-1 border-t border-foreground/10 text-primary">
            + New collection
          </button>
        </div>
      )}
    </div>
  );
}
