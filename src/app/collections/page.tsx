"use client";

import { useEffect, useState } from "react";
import { FolderPlus, Pencil, Trash2 } from "lucide-react";
import {
  createCollectionAction,
  deleteCollectionAction,
  fetchCollectionCaptionsAction,
  fetchCollectionsAction,
  removeCaptionFromCollectionAction,
  renameCollectionAction,
  type LibraryCaption,
  type MemeCollection,
} from "@/app/actions/library";
import { LibraryCaptionGrid } from "@/components/library-caption-grid";
import { useToast } from "@/hooks/use-toast";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<MemeCollection[]>([]);
  const [selected, setSelected] = useState<MemeCollection | null>(null);
  const [captions, setCaptions] = useState<LibraryCaption[]>([]);
  const [captionsLoading, setCaptionsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState<MemeCollection | null>(null);
  const [renameName, setRenameName] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const refresh = async () => {
    const next = await fetchCollectionsAction();
    setCollections(next);
    if (selected) setSelected(next.find((item) => item.id === selected.id) ?? null);
  };

  useEffect(() => {
    refresh().catch((error) => toast({ title: "Could not load collections", description: error.message }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) { setCaptions([]); return; }
    setCaptionsLoading(true);
    fetchCollectionCaptionsAction(selected.id).then(setCaptions)
      .catch((error) => toast({ title: "Could not load collection", description: error.message }))
      .finally(() => setCaptionsLoading(false));
  }, [selected?.id]);

  const create = async () => {
    if (!newName.trim()) return;
    try {
      await createCollectionAction(newName);
      setNewName("");
      setCreating(false);
      await refresh();
    }
    catch (error) { toast({ title: "Could not create collection", description: error instanceof Error ? error.message : "Try again." }); }
  };

  const rename = async () => {
    if (!renaming || !renameName.trim()) return;
    try {
      await renameCollectionAction(renaming.id, renameName);
      setRenaming(null);
      setRenameName("");
      await refresh();
    }
    catch (error) { toast({ title: "Could not rename collection", description: error instanceof Error ? error.message : "Try again." }); }
  };

  const removeCollection = async (collection: MemeCollection) => {
    await deleteCollectionAction(collection.id);
    setConfirmingDelete(null);
    if (selected?.id === collection.id) setSelected(null);
    await refresh();
  };

  const removeCaption = async (captionId: string) => {
    if (!selected) return;
    await removeCaptionFromCollectionAction(selected.id, captionId);
    setCaptions((items) => items.filter((item) => item.id !== captionId));
    await refresh();
  };

  return (
    <div className="py-8 space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div><p className="text-sm uppercase tracking-widest text-primary">Personal library</p><h1 className="text-3xl font-bold">Collections</h1><p className="text-muted-foreground mt-2">Organize saved captions for the moments you need them.</p></div>
        {creating ? (
          <form onSubmit={(event) => { event.preventDefault(); void create(); }} className="flex items-center gap-2">
            <input autoFocus value={newName} onChange={(event) => setNewName(event.target.value)} maxLength={60} placeholder="Collection name" className="w-48 rounded-lg border bg-background px-3 py-2" />
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Add</button>
            <button type="button" onClick={() => { setCreating(false); setNewName(""); }} className="px-3 py-2 rounded-lg border">Cancel</button>
          </form>
        ) : (
          <button onClick={() => setCreating(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground"><FolderPlus className="w-4 h-4" /> New collection</button>
        )}
      </header>

      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        <aside className="space-y-2">
          {loading && <p className="text-muted-foreground">Loading collections…</p>}
          {!loading && collections.length === 0 && <div className="border border-dashed rounded-xl p-5 text-sm text-muted-foreground">Create your first collection to group saved captions.</div>}
          {collections.map((collection) => (
            <div key={collection.id} className={`flex items-center rounded-xl border ${selected?.id === collection.id ? "border-primary bg-primary/5" : "border-foreground/10"}`}>
              {renaming?.id === collection.id ? (
                <form onSubmit={(event) => { event.preventDefault(); void rename(); }} className="flex flex-1 items-center gap-2 p-2">
                  <input autoFocus value={renameName} onChange={(event) => setRenameName(event.target.value)} maxLength={60} className="min-w-0 flex-1 rounded border bg-background px-2 py-1" />
                  <button type="submit" className="text-sm font-medium">Save</button>
                  <button type="button" onClick={() => setRenaming(null)} className="text-sm text-muted-foreground">Cancel</button>
                </form>
              ) : confirmingDelete === collection.id ? (
                <div className="flex flex-1 items-center justify-between gap-2 p-3 text-sm">
                  <span>Delete this collection?</span>
                  <div className="flex gap-2"><button onClick={() => void removeCollection(collection)} className="font-medium text-destructive">Delete</button><button onClick={() => setConfirmingDelete(null)} className="text-muted-foreground">Cancel</button></div>
                </div>
              ) : (
                <>
                  <button onClick={() => setSelected(collection)} className="flex-1 text-left p-3"><span className="block font-medium">{collection.name}</span><span className="text-xs text-muted-foreground">{collection.item_count} items</span></button>
                  <button onClick={() => { setRenaming(collection); setRenameName(collection.name); }} className="p-2" aria-label="Rename collection"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setConfirmingDelete(collection.id)} className="p-2 mr-1 hover:text-destructive" aria-label="Delete collection"><Trash2 className="w-4 h-4" /></button>
                </>
              )}
            </div>
          ))}
        </aside>
        <section>
          {selected ? <><h2 className="text-2xl font-semibold mb-5">{selected.name}</h2>{captionsLoading ? <div className="py-20 text-center text-muted-foreground border border-dashed rounded-2xl">Loading collection…</div> : <LibraryCaptionGrid captions={captions} emptyTitle="This collection is empty" emptyDescription="Open a caption and choose Add to collection." onRemove={removeCaption} />}</> : <div className="py-20 text-center text-muted-foreground border border-dashed rounded-2xl">Select a collection to view its captions.</div>}
        </section>
      </div>
    </div>
  );
}
