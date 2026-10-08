"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RunProgress } from "@/components/generate-content/run-progress";
import { useSSEChannel } from "@/hooks/use-sse-channel";
import { cn } from "@/lib/utils";
import { workspaceRunStages } from "@/lib/workspace/workspace-run-stages";
import {
  brandVoiceRefreshFor,
  useWorkspaceCrudStore,
  useWorkspaceStore,
} from "@/stores/workspace";
import type { SSEEvent } from "@/types/sse";

/**
 * How long a run picked up again on mount may stay silent once its stream is open. A run still going
 * is replayed at once (the backend keeps its events), so silence on an open stream means the backend
 * no longer holds it: it ended while nobody was listening, and the backend forgets an ended run within
 * minutes. A stream that hasn't opened proves nothing, so the wait starts only when it has.
 */
export const RESUMED_RUN_SILENCE_MS = 15_000;

/** The run is going: it reported a step, and nothing that ends it. */
function runIsGoing(events: SSEEvent[]): boolean {
  const steps = events.filter((event) => event.scope !== "connection");
  return (
    steps.length > 0 &&
    !steps.some(
      (event) =>
        event.step.startsWith("pipeline.") ||
        event.status === "failed" ||
        event.step.endsWith(".failed"),
    )
  );
}

interface BrandVoiceRefreshControlProps {
  workspaceId: string;
  buttonVariant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonClassName?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

/**
 * Shared control that triggers the backend brand voice refresh pipeline
 * and renders progress updates streamed via SSE.
 */
export function BrandVoiceRefreshControl({
  workspaceId,
  buttonVariant = "outline",
  buttonSize = "sm",
  buttonClassName,
  disabled,
  children,
}: BrandVoiceRefreshControlProps) {
  const queryClient = useQueryClient();

  // Use useShallow to properly memoize the selector
  const {
    brandVoiceRefresh: refreshState,
    refreshBrandVoice,
    setBrandVoiceRefreshState,
    clearCurrentOperation,
  } = useWorkspaceStore(
    useShallow((state) => ({
      brandVoiceRefresh: state.brandVoiceRefresh,
      refreshBrandVoice: state.refreshBrandVoice,
      setBrandVoiceRefreshState: state.setBrandVoiceRefreshState,
      clearCurrentOperation: state.clearCurrentOperation,
    })),
  );

  // Only this workspace's run: another workspace's doesn't lock the button or open the dialog here.
  const brandVoiceRefresh = brandVoiceRefreshFor(refreshState, workspaceId);
  const { setCurrentOperation } = useWorkspaceCrudStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [operationId, setOperationId] = useState<string | null>(null);
  // A run started before this section last unmounted (D5b, rext-control#493): it may have ended
  // while nobody listened, so its dialog waits until the stream shows it still going.
  const [resumedOperationId, setResumedOperationId] = useState<string | null>(
    null,
  );
  const startingRef = useRef(false);
  const startedOperationRef = useRef<string | null>(null);

  // A run started here opens its dialog at once; one found on mount is picked up quietly.
  useEffect(() => {
    const stored = brandVoiceRefresh.operationId;
    if (!stored || stored === operationId) return;
    setOperationId(stored);
    if (startingRef.current || stored === startedOperationRef.current) {
      setIsDialogOpen(true);
    } else {
      setResumedOperationId(stored);
    }
  }, [brandVoiceRefresh.operationId, operationId]);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setOperationId(null);
    setResumedOperationId(null);
    setBrandVoiceRefreshState(workspaceId, {
      isRefreshing: false,
      operationId: undefined,
    });
    clearCurrentOperation();
  }, [clearCurrentOperation, setBrandVoiceRefreshState, workspaceId]);

  const reloadBrandVoice = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["workspace", workspaceId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["workspace"], // Broader invalidation to catch slug-based queries if ID was passed
        }),
        queryClient.invalidateQueries({
          queryKey: ["workspaces", "brand-voice", workspaceId],
        }),
        queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
      ]),
    [queryClient, workspaceId],
  );

  const { events, status, disconnect, isConnected } = useSSEChannel(
    operationId,
    {
      autoConnect: true,
      onComplete: async () => {
        toast.success("The brand voice was read from your website again");
        await reloadBrandVoice();
        closeDialog();
      },
      // Ended while nobody listened, outcome unknown: read the brand voice again, no success toast.
      onEnded: async () => {
        await reloadBrandVoice();
        closeDialog();
      },
      onError: (errorMessage) => {
        toast.error(errorMessage || "The website couldn't be read");
        setBrandVoiceRefreshState(workspaceId, {
          refreshError: errorMessage,
        });
        closeDialog();
      },
    },
  );

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        setIsDialogOpen(true);
        return;
      }

      // Closing the dialog is a cancellation from the user's perspective.
      // Clear the refresh state immediately instead of leaving the button in
      // a loading state until the backend operation eventually finishes.
      disconnect();
      closeDialog();
    },
    [closeDialog, disconnect],
  );

  // Reset subscription when dialog closes manually; a run picked up on mount listens without one.
  useEffect(() => {
    if (!isDialogOpen && !resumedOperationId) {
      disconnect();
    }
  }, [disconnect, isDialogOpen, resumedOperationId]);

  // The picked-up run is still going: show its progress.
  const resumedRunIsGoing =
    resumedOperationId !== null &&
    resumedOperationId === operationId &&
    runIsGoing(events);
  useEffect(() => {
    if (!resumedRunIsGoing) return;
    setResumedOperationId(null);
    setIsDialogOpen(true);
  }, [resumedRunIsGoing]);

  // The backend no longer holds the picked-up run: its stream opened and replayed nothing, so it
  // ended unseen. The section reads the brand voice again, which shows the new one if the run saved
  // it, and the button is free. Until the stream opens (the backend down, a retry), the run stays.
  const resumedStreamIsOpen =
    resumedOperationId !== null &&
    resumedOperationId === operationId &&
    (isConnected || events.some((event) => event.scope === "connection"));
  useEffect(() => {
    if (!resumedStreamIsOpen) return;
    const timer = setTimeout(() => {
      void reloadBrandVoice();
      closeDialog();
    }, RESUMED_RUN_SILENCE_MS);
    return () => clearTimeout(timer);
  }, [closeDialog, reloadBrandVoice, resumedStreamIsOpen]);

  const handleRefresh = useCallback(async () => {
    startingRef.current = true;
    try {
      const operationId = await refreshBrandVoice(workspaceId);
      startedOperationRef.current = operationId;
      setCurrentOperation({ operationId, workspaceId });
      setBrandVoiceRefreshState(workspaceId, {
        isRefreshing: true,
        operationId: operationId,
        refreshError: undefined,
      });
      toast.success("Reading your website…");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Reading the website couldn't start. Try again.";
      toast.error(message);
    } finally {
      startingRef.current = false;
    }
  }, [
    refreshBrandVoice,
    workspaceId,
    setBrandVoiceRefreshState,
    setCurrentOperation,
  ]);

  const idleContent = useMemo(() => {
    if (children) {
      return children;
    }

    return (
      <>
        <RefreshCw className="h-4 w-4" />
        <span>Refresh</span>
      </>
    );
  }, [children]);

  return (
    <>
      <Button
        // Never a form's submit: the control can sit inside one (General settings' offer to read
        // a website just added), and a read must not send that form along with it.
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        disabled={disabled || brandVoiceRefresh.isRefreshing}
        className={cn(
          "flex items-center gap-2",
          buttonSize === "icon" ? "p-2" : "",
          buttonClassName,
        )}
        onClick={handleRefresh}
        title="Read the workspace's website again and replace the brand voice"
      >
        {brandVoiceRefresh.isRefreshing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Reading…</span>
          </>
        ) : (
          idleContent
        )}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Reading your website</DialogTitle>
            <DialogDescription>
              The brand voice is read from the workspace's website again and
              replaces the one saved. It usually takes less than a minute.
            </DialogDescription>
          </DialogHeader>

          <RunProgress stages={workspaceRunStages(events)} />

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>{isConnected ? "Connected" : "Connecting…"}</span>
            {status.retryCount > 0 && (
              <span>{`Retry attempt ${status.retryCount}`}</span>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
