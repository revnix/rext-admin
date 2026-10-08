"use client";

import { useRef } from "react";
import {
  FormPage,
  PageSkeleton,
  StepColumn,
  WorkingSurface,
} from "@/components/layouts";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkspaceCreateWizard } from "@/components/workspace";
import { usePageTitle } from "@/hooks/use-page-title";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { BRAND_VOICE_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

const TITLE = "Set up your brand voice";
const DESCRIPTION =
  "Add your website or describe your business, and Rext writes in your voice.";

/** What the page does, decided once from the workspace's first answer. */
type Start =
  | { kind: "form" }
  | { kind: "resume"; operationId: string; website: string | null }
  | { kind: "done" };

/**
 * Setting up a workspace made with "Skip for now" (rext-control task 905): the create page's own
 * form, wait and review, for a workspace that is there already and has no brand voice yet. A
 * set-up left during its wait is picked up where it is; a workspace that has been set up is sent
 * to its brand voice. Only someone who may change the brand voice sets it up, as in the settings.
 */
export default function WorkspaceSetupPage() {
  usePageTitle(TITLE, DESCRIPTION);
  // The workspace's own detail, which says whether an analysis has ever run.
  const { workspace, workspaceId } = useWorkspace();
  const { hasPermission: canSetUp, isLoading: isPermissionLoading } =
    useWorkspacePermission(BRAND_VOICE_PERMISSIONS.UPDATE, workspaceId);
  // Only the first answer decides: the set-up's own run moves the status on while it is
  // followed here, and that must not swap the wait for anything else.
  const start = useRef<Start | null>(null);
  if (workspace?.id && start.current === null) {
    const run = workspace.pipeline;
    start.current =
      run?.status === "running" && run.operation_id
        ? {
            kind: "resume",
            operationId: run.operation_id,
            website: workspace.url,
          }
        : // Never analysed, or a set-up that ended badly and left nothing: the form again.
          run?.status === "not_started" ||
            ((run?.status === "failed" || run?.status === "interrupted") &&
              !workspace.brand_voice)
          ? { kind: "form" }
          : { kind: "done" };
  }

  if (!workspace?.id || start.current === null || isPermissionLoading) {
    return (
      <PageSkeleton layout="form" centered label="Loading your workspace..." />
    );
  }

  if (!canSetUp) {
    return (
      <FormPage centered title={TITLE} description={DESCRIPTION}>
        <EmptyState
          title="You can't set up this workspace's brand voice"
          description="Ask the workspace's owner or an admin: setting it up needs the right to change the brand voice."
          action={{ label: "Back to home", href: workspaceRoutes.root("") }}
        />
      </FormPage>
    );
  }

  if (start.current.kind === "done") {
    return (
      <FormPage centered title={TITLE} description={DESCRIPTION}>
        <EmptyState
          title="This workspace is already set up"
          description="Its brand voice is in the workspace's settings, where you can read the website again or change any word of it."
          action={{
            label: "Open the brand voice",
            href: workspaceRoutes.settings.brandVoice(workspace.slug),
          }}
        />
      </FormPage>
    );
  }

  return (
    <WorkingSurface title={TITLE} description={DESCRIPTION}>
      <StepColumn withSidePane>
        <WorkspaceCreateWizard
          existing={{
            id: workspace.id,
            slug: workspace.slug,
            name: workspace.name,
            ...(start.current.kind === "resume"
              ? {
                  resume: {
                    operationId: start.current.operationId,
                    website: start.current.website,
                  },
                }
              : {}),
          }}
        />
      </StepColumn>
    </WorkingSurface>
  );
}
