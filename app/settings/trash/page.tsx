"use client";

import { ArrowLeft, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { settingsRoutes } from "@/lib/routes";
import type { Route } from "next";

interface DeletedWorkspaceRow {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  timezone: string | null;
  url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  recovery_deadline: string;
  days_remaining: number;
}

export default function TrashSettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [restoringWorkspaceId, setRestoringWorkspaceId] = useState<
    string | null
  >(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["deleted-workspaces"],
    queryFn: () => apiClient.workspaces.getDeleted(),
    staleTime: 30_000,
  });

  const workspaces = useMemo<DeletedWorkspaceRow[]>(() => {
    return data?.workspaces ?? [];
  }, [data]);

  const handleRestore = async (workspace: DeletedWorkspaceRow) => {
    setRestoringWorkspaceId(workspace.id);
    try {
      await apiClient.workspaces.restore(workspace.id);
      toast.success(`Workspace "${workspace.name}" restored`);
      await queryClient.invalidateQueries({ queryKey: ["deleted-workspaces"] });
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      await refetch();
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to restore workspace";
      toast.error(message);
    } finally {
      setRestoringWorkspaceId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Trash</h2>
          <p className="text-muted-foreground">
            Restore workspaces that were deleted within the last 30 days.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={settingsRoutes.root as Route}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to settings
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isLoading || isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                isLoading || isFetching ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Recently deleted workspaces
          </CardTitle>
          <CardDescription>
            {data?.total_count ?? 0} recoverable workspace
            {(data?.total_count ?? 0) === 1 ? "" : "s"} available.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="rounded border border-dashed p-8 text-center text-sm text-muted-foreground">
              Loading deleted workspaces…
            </div>
          ) : workspaces.length === 0 ? (
            <div className="rounded border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nothing in trash.
            </div>
          ) : (
            <div className="space-y-3">
              {workspaces.map((workspace) => {
                const deletedDaysAgo = Math.max(
                  0,
                  30 - workspace.days_remaining,
                );

                return (
                  <div
                    key={workspace.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{workspace.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Deleted {deletedDaysAgo} day
                        {deletedDaysAgo === 1 ? "" : "s"} ago
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {workspace.days_remaining} day
                        {workspace.days_remaining === 1 ? "" : "s"} left to
                        restore
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleRestore(workspace)}
                      disabled={restoringWorkspaceId === workspace.id}
                    >
                      {restoringWorkspaceId === workspace.id ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Restoring…
                        </>
                      ) : (
                        <>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restore
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
