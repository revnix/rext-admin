"use client";

import { CheckCircle2, ExternalLink, Loader2, Unlink } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  useConnectGoogle,
  useDisconnectGoogle,
  useGoogleConnectionStatus,
} from "@/hooks/use-google-integration";
import { workspaceRoutes } from "@/lib/routes";

interface GoogleConnectionCardProps {
  workspaceId: string;
  workspaceSlug: string;
  canManage: boolean;
}

/**
 * Connection status card for the integrations grid — mirrors the existing
 * WordPress/Shopify cards in app/w/[workspaceSlug]/integrations/page.tsx,
 * but for Google Search Console + GA4 (Modules 1-4), driven by live
 * connection status rather than the legacy integrations service.
 */
export function GoogleConnectionCard({
  workspaceId,
  workspaceSlug,
  canManage,
}: GoogleConnectionCardProps) {
  const { data: status, isLoading } = useGoogleConnectionStatus(workspaceId);
  const connectMutation = useConnectGoogle();
  const disconnectMutation = useDisconnectGoogle();

  const isConnected = !!status?.is_active;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border bg-white">
            <AvatarImage
              src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
              alt="Google"
              className="object-contain p-1.5"
            />
            <AvatarFallback>G</AvatarFallback>
          </Avatar>
        </div>
        {!isLoading && (
          <StatusBadge
            status={isConnected ? "success" : "default"}
            size="sm"
            variant={isConnected ? "success" : "outline"}
          >
            {isConnected ? "Connected" : "Not connected"}
          </StatusBadge>
        )}
      </CardHeader>
      <CardContent className="p-6 pt-2">
        <CardTitle className="text-base font-semibold mb-2">
          Google Search Console &amp; Analytics
        </CardTitle>
        <CardDescription className="line-clamp-2 min-h-10">
          {isConnected && status?.google_account_email
            ? `Connected as ${status.google_account_email}`
            : "Connect Google to track search performance, indexing, and content scores."}
        </CardDescription>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-6 border-t border-slate-100">
        {isConnected ? (
          <>
            <Button asChild variant="outline" size="sm">
              <Link
                href={
                  workspaceRoutes.googleIntegration.dashboard(
                    workspaceSlug,
                  ) as Route
                }
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Dashboard
              </Link>
            </Button>
            {canManage && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={disconnectMutation.isPending}
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect Google?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This stops syncing Search Console and Analytics data for
                      this workspace. Already-synced data isn&apos;t deleted,
                      but the dashboard, content inventory, and scores will stop
                      updating until you reconnect.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => disconnectMutation.mutate(workspaceId)}
                    >
                      Disconnect
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </>
        ) : canManage ? (
          <Button
            size="sm"
            onClick={() => connectMutation.mutate({ workspaceId })}
            disabled={connectMutation.isPending}
          >
            {connectMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Connect Google
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">
            Admin or above required to connect
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
