"use client";

import { FormEvent, useEffect, useState } from "react";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import {
  createMemeCommentAction,
  deleteMemeCommentAction,
  fetchMemeCommentsAction,
  type MemeComment,
} from "@/app/actions/comments";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type MemeCommentsDialogProps = {
  memeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCount?: number;
  onCountChange?: (count: number) => void;
};

const formatCommentTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

export function MemeCommentsDialog({
  memeId,
  open,
  onOpenChange,
  initialCount = 0,
  onCountChange,
}: MemeCommentsDialogProps) {
  const [comments, setComments] = useState<MemeComment[]>([]);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    let active = true;
    setIsLoading(true);
    fetchMemeCommentsAction(memeId)
      .then((nextComments) => {
        if (!active) return;
        setComments(nextComments);
        onCountChange?.(nextComments.length);
      })
      .catch((error) => {
        toast({
          title: "Could not load comments",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      })
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [memeId, onCountChange, open, toast]);

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim() || isPosting) return;
    setIsPosting(true);
    try {
      const comment = await createMemeCommentAction(memeId, content);
      setComments((current) => {
        const next = [...current, comment];
        onCountChange?.(next.length);
        return next;
      });
      setContent("");
    } catch (error) {
      toast({
        title: "Could not post comment",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const removeComment = async (commentId: number) => {
    try {
      await deleteMemeCommentAction(commentId);
      setComments((current) => {
        const next = current.filter((comment) => comment.id !== commentId);
        onCountChange?.(next.length);
        return next;
      });
    } catch (error) {
      toast({
        title: "Could not delete comment",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-xl flex-col overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-5 pr-12">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Comments
          </DialogTitle>
          <DialogDescription>
            {comments.length || initialCount} {(comments.length || initialCount) === 1 ? "comment" : "comments"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-40 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading comments…</p>
          ) : comments.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-medium text-foreground">No comments yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Start the conversation.</p>
            </div>
          ) : (
            comments.map((comment) => (
              <article key={comment.id} className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold">
                  {comment.author_avatar_url ? (
                    <img
                      src={comment.author_avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    comment.author_name.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{comment.author_name}</p>
                      <p className="text-xs text-muted-foreground">{formatCommentTime(comment.created_at)}</p>
                    </div>
                    {comment.can_delete && (
                      <button
                        type="button"
                        onClick={() => removeComment(comment.id)}
                        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Delete your comment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                    {comment.content}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>

        <form onSubmit={submitComment} className="border-t bg-background p-4">
          <div className="flex items-end gap-2 rounded-2xl border bg-card px-4 py-2 focus-within:border-primary">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value.slice(0, 500))}
              placeholder="Write a comment…"
              rows={1}
              className="max-h-28 min-h-10 flex-1 resize-none bg-transparent py-2 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={!content.trim() || isPosting}
              className="mb-1 rounded-full bg-primary p-2 text-primary-foreground transition-opacity disabled:opacity-40"
              aria-label="Post comment"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-right text-xs text-muted-foreground">{content.length}/500</p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
