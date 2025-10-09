"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorkspaceProgressTimeline } from "@/components/workspace/workspace-progress-timeline";
import { useSSEChannel } from "@/hooks/use-sse-channel";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { BrandVoiceRefreshState } from "@/types/workspace";

interface BrandVoiceRefreshControlProps {
  workspaceId: string;
  buttonVariant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonClassName?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

interface SelectorReturn {
  brandVoiceRefresh: BrandVoiceRefreshState;
  refreshBrandVoice: (workspaceId: string) => Promise<string>;
  setBrandVoiceRefreshState: (state: Partial<BrandVoiceRefreshState>) => void;
  clearCurrentOperation: () => void;
}

/**
 * Shared control that triggers the backend brand voice refresh pipeline
 * and renders progress updates streamed via SSE.
 */
// Stable selector outside component to prevent re-renders
const selector = (state: unknown): SelectorReturn => ({
  brandVoiceRefresh: (state as { brandVoiceRefresh: BrandVoiceRefreshState })
    .brandVoiceRefresh,
  refreshBrandVoice: (
    state as { refreshBrandVoice: SelectorReturn["refreshBrandVoice"] }
  ).refreshBrandVoice,
  setBrandVoiceRefreshState: (
    state as {
      setBrandVoiceRefreshState: SelectorReturn["setBrandVoiceRefreshState"];
    }
  ).setBrandVoiceRefreshState,
  clearCurrentOperation: (state as { clearCurrentOperation: () => void })
    .clearCurrentOperation,
});

export function BrandVoiceRefreshControl({
  workspaceId,
  buttonVariant = "outline",
  buttonSize = "sm",
  buttonClassName,
  disabled,
  children,
}: BrandVoiceRefreshControlProps) {
  const queryClient = useQueryClient();
  const {
    brandVoiceRefresh,
    refreshBrandVoice,
    setBrandVoiceRefreshState,
    clearCurrentOperation,
  } = useWorkspaceStore(selector);

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

  // Reset subscription when dialog closes manually
  useEffect(() => {
    if (!isDialogOpen) {
      disconnect();
    }
  }, [disconnect, isDialogOpen]);

  const handleRefresh = useCallback(async () => {
    try {
      const id = await refreshBrandVoice(workspaceId);
      setBrandVoiceRefreshState({
        isRefreshing: true,
        operationId: id,
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
  }, [refreshBrandVoice, workspaceId, setBrandVoiceRefreshState]);

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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
