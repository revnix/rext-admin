"use client";

import { Loader2, Plus } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { useWorkspace } from "@/providers/workspace-provider";
import { workspaceRoutes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { AudienceCard } from "@/components/audiences/audience-card";
import { PermissionGuard } from "@/components/permission/permission-guard";
import type { Audience } from "@/types/workspace";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { useWorkspacePermission } from "@/hooks/use-permission";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useAudiences } from "@/hooks/use-audiences";
import type { Route } from "next";

export default function AudiencesPage() {
  const { workspace, workspaceSlug, workspaceId } = useWorkspace();
  const { data: audiencesData, isLoading } = useAudiences(workspace?.id || null);
  const audiences = audiencesData?.audiences || [];

  const { isLoading: isPermLoading } = useWorkspacePermission(
    CONTENT_PERMISSIONS.READ,
    workspaceId,
  );
  const { hasPermission: canCreate } = useWorkspacePermission(
    CONTENT_PERMISSIONS.CREATE,
    workspaceId,
  );

  if (!workspace?.id || isPermLoading) {
    return (
      <PageLayout title="Loading Permissions...">
        <div className="space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Audiences"
      description={`${audiences.length} audience segments — who your content is written for`}
      fullWidth
      actions={
        canCreate ? (
          <div className="flex gap-2 w-full sm:w-auto">
            <Link
              className="w-full sm:w-auto"
              href={workspaceRoutes.audience_create(workspaceSlug) as Route}
            >
              <Button className="w-full sm:w-auto">
                <Plus size={16} className="mr-2" />
                Create Audience
              </Button>
            </Link>
          </div>
        ) : null
      }
    >
      <PermissionGuard
        permission={CONTENT_PERMISSIONS.READ}
        showLoading={false}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to manage audiences in this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Required permission:{" "}
                <code className="text-xs bg-muted px-1 rounded">
                  content:create
                </code>
              </p>
            </CardContent>
          </Card>
        }
      >
        <div className="space-y-8 max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                Loading audiences...
              </div>
            ) : (
              audiences
                .filter((a) => a.id)
                .map((audience) => (
                  <AudienceCard
                    key={audience.id}
                    audience={audience as Audience & { id: string }}
                  />
                ))
            )}

            {canCreate && (
              <Link
                href={workspaceRoutes.audience_create(workspaceSlug) as Route}
                className="contents"
              >
                <Card className="border border-dashed border-border shadow-none hover:border-primary/50 hover:bg-accent/50 transition-all bg-transparent flex items-center justify-center min-h-[300px] cursor-pointer group rounded-2xl">
                  <CardContent className="flex flex-col items-center justify-center text-center p-6 bg-transparent">
                    <div className="h-14 w-14 rounded-2xl bg-card border border-border flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-primary/50 transition-all shadow-sm">
                      <Plus
                        className="text-muted-foreground group-hover:text-primary transition-colors"
                        size={24}
                      />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">
                      Create New Audience
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Add a new reader/buyer segment
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        </div>
      </PermissionGuard>
    </PageLayout>
  );
}
