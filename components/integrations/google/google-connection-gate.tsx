"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoogleConnectionCard } from "@/components/integrations/google/google-connection-card";
import { GoogleSiteMappingForm } from "@/components/integrations/google/google-site-mapping-form";
import { useGoogleConnectionStatus } from "@/hooks/use-google-integration";

interface GoogleConnectionGateProps {
  workspaceId: string;
  workspaceSlug: string;
  canManage: boolean;
  children: ReactNode;
  /** Show the per-site mapping form below children — only needed once per section (Dashboard). */
  showSiteMapping?: boolean;
}

/**
 * Gates Modules 1/2/4's pages behind the connection prerequisite: if Google
 * isn't connected yet, show the connect CTA + site mapping instead of a
 * dashboard full of nulls. Once connected, renders children as-is — pages
 * still handle missing site-mapping data gracefully (null fields), since a
 * connected-but-unmapped workspace is a valid, if empty, state.
 */
export function GoogleConnectionGate({
  workspaceId,
  workspaceSlug,
  canManage,
  children,
  showSiteMapping = false,
}: GoogleConnectionGateProps) {
  const { data: status, isLoading } = useGoogleConnectionStatus(workspaceId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!status?.is_active) {
    return (
      <div className="space-y-6">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Connect Google to get started</CardTitle>
            <CardDescription>
              Search performance, indexing status, and content scores are all
              powered by Google Search Console and Analytics — connect your
              account to unlock this section.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-sm">
              <GoogleConnectionCard
                workspaceId={workspaceId}
                workspaceSlug={workspaceSlug}
                canManage={canManage}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {children}
      {showSiteMapping && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Site Mapping</CardTitle>
            <CardDescription>
              Each connected WordPress site needs a Search Console property and
              GA4 property mapped before its content shows real data here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GoogleSiteMappingForm
              workspaceId={workspaceId}
              canManage={canManage}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
