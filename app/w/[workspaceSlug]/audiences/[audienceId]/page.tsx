"use client";

import { PageLayout } from "@/components/page-layout";
import { useWorkspace } from "@/providers/workspace-provider";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAudience } from "@/hooks/use-audiences";
import { AudienceDetail } from "@/components/audiences/audience-detail";
import { useParams } from "next/navigation";
import type { Route } from "next";

export default function AudienceDetailPage() {
  const { workspace, workspaceSlug } = useWorkspace();
  const params = useParams();
  const audienceId = params.audienceId as string;

  const {
    data: audienceData,
    isLoading,
    error,
  } = useAudience(workspace?.id || null, audienceId);
  const audience = audienceData?.audience;

  const isWorkspaceLoading = !workspace && !error;
  const isAudienceLoading = isLoading || isWorkspaceLoading;

  if (isAudienceLoading) {
    return (
      <PageLayout title="Audiences">
        <div className="flex items-start p-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-3 text-muted-foreground">Loading audience...</span>
        </div>
      </PageLayout>
    );
  }

  if (error || !audience) {
    return (
      <PageLayout title="Audience Not Found">
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <p className="text-muted-foreground">
            The audience you are looking for does not exist or you do not have
            permission to view it.
          </p>

          <Link href={`/w/${workspaceSlug}/audiences` as Route}>
            <Button
              variant="outline"
              className="h-10 px-4 rounded-xl border-slate-200"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Audiences
            </Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={audience.name} description={audience.description || undefined}>
      <AudienceDetail audience={audience} />
    </PageLayout>
  );
}
