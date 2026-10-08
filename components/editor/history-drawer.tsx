"use client";

import { ArrowLeft } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useConfirmation } from "@/components/ui/confirmation-dialog";
import { Notice } from "@/components/ui/notice";
import { SafeLexicalEditor } from "@/components/ui/safe-lexical-editor";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useContentVersion,
  useRestoreContentVersion,
} from "@/hooks/use-content";
import { dateFormat } from "@/lib/formatters/date-formatters";
import type {
  ContentItem,
  ContentVersion,
  ContentVersionSource,
  RestoreUnsaved,
} from "@/types/content";

/** What each kind of version holds, in a word or two. */
/** When a version last took a save; one that took none after it was made, when it was made. */
const versionTime = (
  version: Pick<ContentVersion, "created_at" | "updated_at">,
) => version.updated_at ?? version.created_at;

const SOURCE_WORDS: Record<ContentVersionSource, string> = {
  generation: "As first written",
  edit: "Edited",
  // The text as the restore put it back (the text it replaced is kept just before it, as an
  // edit).
  restore: "Restored",
  publish: "As published",
};

const words = (count: number) =>
  `${count.toLocaleString()} ${count === 1 ? "word" : "words"}`;

/** "Edited · Sam Rivera · 1,072 words": what the version is, whose it is, how long. */
const summary = (version: ContentVersion) =>
  [
    SOURCE_WORDS[version.source] ?? "Saved",
    version.created_by?.name,
    words(version.word_count),
  ]
    .filter(Boolean)
    .join(" · ");

/**
 * The editor's History (task 706): the article's kept versions, newest first. Opening one shows
 * its text; restoring it puts that text back on the article. The backend keeps the text as it
 * stands as a version first, so a restore can itself be undone from here.
 */
export function HistoryDrawer({
  open,
  onClose,
  workspaceId,
  contentId,
  versions,
  takeUnsaved,
  onNotRestored,
  onRestored,
}: {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  contentId: string;
  versions: ContentVersion[];
  /** What the editor still holds unsaved, with its own saving stopped: it goes with the restore,
   *  which keeps it as a version. Null when nothing is unsaved. */
  takeUnsaved: () => Promise<RestoreUnsaved | null>;
  /** The restore didn't happen: the editor saves by itself again. */
  onNotRestored: () => void;
  /** The article as the restore left it. */
  onRestored: (article: ContentItem) => void;
}) {
  // The version being looked at, or the list.
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const opened = versions.find((version) => version.id === openedId) ?? null;
  const detail = useContentVersion(
    workspaceId,
    contentId,
    open ? (opened?.id ?? null) : null,
  );
  const restore = useRestoreContentVersion();
  // One save-and-restore at a time, from the question to the answer: the save that goes first
  // can be slow, and the restore only reports itself pending once that save is through.
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const { confirm, ConfirmationComponent } = useConfirmation();

  const back = () => {
    setOpenedId(null);
    setProblem(null);
  };

  const restoreOpened = async () => {
    if (!opened || running.current) return;
    running.current = true;
    try {
      await saveThenRestore(opened.id);
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  const saveThenRestore = async (versionId: string) => {
    setProblem(null);
    const agreed = await confirm({
      title: "Restore this version?",
      description:
        "The article goes back to this text. The text as it stands now is kept as a version first, so you can return to it.",
      confirmText: "Restore version",
      cancelText: "Cancel",
      variant: "default",
    });
    if (!agreed) return;
    setBusy(true);
    // The text as it stands goes with the restore itself: the backend keeps it as a version,
    // restores and trims the history in one step, so no save made just before can cost the
    // version being restored.
    const unsaved = await takeUnsaved();
    try {
      const article = await restore.mutateAsync({
        workspaceId,
        contentId,
        versionId,
        unsaved,
      });
      // The editor starts again on the restored article, and this drawer goes with it.
      onRestored(article);
    } catch (error) {
      onNotRestored();
      setProblem(
        error instanceof Error && error.message
          ? `The version wasn't restored: ${error.message}`
          : "The version wasn't restored. Try again.",
      );
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
        <SheetContent side="right" className="gap-0 bg-card p-0">
          <SheetHeader className="border-b border-border px-6 py-4">
            <SheetTitle>History</SheetTitle>
            <SheetDescription>
              Earlier versions of this article. One is kept for each sitting of
              edits; the newest 20 stay.
            </SheetDescription>
          </SheetHeader>

          {opened ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="border-b border-border px-3 py-2">
                <Button
                  data-rec="show"
                  size="sm"
                  variant="ghost"
                  onClick={back}
                  disabled={busy}
                >
                  <ArrowLeft size={16} aria-hidden />
                  All versions
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <p className="text-label font-medium text-foreground">
                  {dateFormat.shortWithTime(versionTime(opened))}
                </p>
                <p className="mb-4 text-caption text-muted-foreground">
                  {summary(opened)}
                </p>
                {problem ? (
                  <Notice
                    tone="danger"
                    title="Nothing was restored"
                    className="mb-4"
                  >
                    {problem}
                  </Notice>
                ) : null}
                {detail.isPending ? (
                  <div className="space-y-3" aria-busy="true">
                    <Skeleton className="h-6 w-4/5" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ) : detail.isError ? (
                  <Notice tone="danger" title="This version couldn't be read">
                    Go back to the list and open it again.
                  </Notice>
                ) : (
                  <article className="prose prose-app max-w-none">
                    {/* layout-ok: the version's own title, in its prose */}
                    <h1>{detail.data.title}</h1>
                    <SafeLexicalEditor
                      key={detail.data.id}
                      readOnly
                      bare
                      initialValue={detail.data.body_markdown}
                    />
                  </article>
                )}
              </div>
              <div className="border-t border-border px-6 py-3">
                <Button
                  data-rec="show"
                  className="w-full"
                  onClick={restoreOpened}
                  disabled={!detail.isSuccess || busy}
                >
                  {busy ? "Restoring…" : "Restore this version"}
                </Button>
              </div>
            </div>
          ) : versions.length === 0 ? (
            <p className="px-6 py-4 text-table text-muted-foreground">
              No earlier versions yet. The first one is kept when the article is
              edited.
            </p>
          ) : (
            <ol className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              {versions.map((version) => (
                <li key={version.id}>
                  <button
                    type="button"
                    onClick={() => setOpenedId(version.id)}
                    className="flex w-full cursor-pointer flex-col gap-0.5 rounded-md px-3 py-2 text-left hover:bg-muted"
                  >
                    <span className="text-label font-medium text-foreground">
                      {dateFormat.shortWithTime(versionTime(version))}
                    </span>
                    <span className="text-caption text-muted-foreground">
                      {summary(version)}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </SheetContent>
      </Sheet>
      {ConfirmationComponent}
    </>
  );
}
