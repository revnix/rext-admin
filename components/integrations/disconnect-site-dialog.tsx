"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDisconnectWordPress } from "@/hooks/use-integrations";
import type { Integration } from "@/lib/api-client/integrations";
import { log } from "@/lib/logger";
import { siteHost } from "./site-host";

/**
 * Disconnecting a site asks for its name typed (design/app-language.md §6: a typed name for
 * deleting a workspace or disconnecting an integration). The backend forgets the site and its key
 * for good; posts already published stay on the site.
 */
export function DisconnectSiteDialog({
  workspaceId,
  site,
  open,
  onOpenChange,
}: {
  workspaceId: string;
  /** The site to disconnect, kept while the dialog closes. */
  site: Integration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const disconnect = useDisconnectWordPress(workspaceId);
  const [typed, setTyped] = useState("");
  const host = site ? siteHost(site) : "";
  const matches = typed.trim().toLowerCase() === host.toLowerCase();

  const close = (next: boolean) => {
    if (!next) setTyped("");
    onOpenChange(next);
  };

  const onDisconnect = async (event: React.MouseEvent) => {
    event.preventDefault();
    if (!site || !matches) return;
    try {
      await disconnect.mutateAsync(site.id);
      toast.success(`${host} is disconnected`);
      close(false);
    } catch (error) {
      log.error("Disconnecting a WordPress site failed", error);
      toast.error(`${host} is still connected`, {
        description:
          error instanceof Error && error.message
            ? error.message
            : "Try again in a moment.",
      });
    }
  };

  return (
    <AlertDialog open={open && Boolean(site)} onOpenChange={close}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="break-all">
            Disconnect {host}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Rext AI stops publishing to it and forgets its key. Posts already
            published stay on your site. To connect it again, you paste the
            plugin's key again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="disconnect-confirmation">
            Type <span className="font-mono break-all">{host}</span> to confirm
          </Label>
          <Input
            id="disconnect-confirmation"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            disabled={disconnect.isPending}
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="none"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={disconnect.isPending}>
            Keep site
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onDisconnect}
            disabled={!matches || disconnect.isPending}
            className={buttonVariants({ variant: "destructive" })}
          >
            {disconnect.isPending && (
              <Loader2 className="animate-spin" aria-hidden />
            )}
            Disconnect site
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
