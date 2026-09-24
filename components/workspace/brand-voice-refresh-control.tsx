"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { WorkspaceProgressTimeline } from "@/components/workspace";
import { useSSEChannel } from "@/hooks/use-sse-channel";
import { cn } from "@/lib/utils";
import { useWorkspaceCrudStore, useWorkspaceStore } from "@/stores/workspace";

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
    brandVoiceRefresh,
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

  const { setCurrentOperation } = useWorkspaceCrudStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [operationId, setOperationId] = useState<string | null>(null);

  // Ensure dialog opens whenever a new operation ID is issued
  useEffect(() => {
    if (
      brandVoiceRefresh.operationId &&
      brandVoiceRefresh.operationId !== operationId
    ) {
      setOperationId(brandVoiceRefresh.operationId);
      setIsDialogOpen(true);
    }
  }, [brandVoiceRefresh.operationId, operationId]);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setOperationId(null);
    setBrandVoiceRefreshState({
      isRefreshing: false,
      operationId: undefined,
    });
    clearCurrentOperation();
  }, [clearCurrentOperation, setBrandVoiceRefreshState]);

  const { events, latestEvent, status, disconnect, isConnected } =
    useSSEChannel(operationId, {
      autoConnect: true,
      onComplete: async () => {
        toast.success("Brand voice updated successfully");
        await Promise.all([
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
        ]);
        closeDialog();
      },
      onError: (errorMessage) => {
        toast.error(errorMessage || "Brand voice refresh failed");
        setBrandVoiceRefreshState({
          refreshError: errorMessage,
        });
        closeDialog();
      },
    });

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

  // Reset subscription when dialog closes manually
  useEffect(() => {
    if (!isDialogOpen) {
      disconnect();
    }
  }, [disconnect, isDialogOpen]);

  const handleRefresh = useCallback(async () => {
    try {
      const operationId = await refreshBrandVoice(workspaceId);
      setCurrentOperation({ operationId, workspaceId });
      setBrandVoiceRefreshState({
        isRefreshing: true,
        operationId: operationId,
        refreshError: undefined,
      });
      toast.success("Refreshing brand voice...");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to start brand voice refresh";
      toast.error(message);
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
        variant={buttonVariant}
        size={buttonSize}
        disabled={disabled || brandVoiceRefresh.isRefreshing}
        className={cn(
          "flex items-center gap-2",
          buttonSize === "icon" ? "p-2" : "",
          buttonClassName,
        )}
        onClick={handleRefresh}
        title="Re-analyze workspace content to refresh brand voice"
      >
        {brandVoiceRefresh.isRefreshing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Refreshing...</span>
          </>
        ) : (
          idleContent
        )}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Refreshing Brand Voice</DialogTitle>
            <DialogDescription>
              We&apos;re re-scraping the workspace website and updating the
              brand voice profile. This usually takes less than a minute.
            </DialogDescription>
          </DialogHeader>

          <WorkspaceProgressTimeline
            events={events}
            progress={latestEvent?.progress ?? 0}
          />

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {isConnected ? "Connected to server" : "Awaiting connection..."}
            </span>
            {status.retryCount > 0 && (
              <span>{`Retry attempt ${status.retryCount}`}</span>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
