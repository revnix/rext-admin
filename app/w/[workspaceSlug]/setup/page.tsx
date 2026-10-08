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
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

const TITLE = "Set up your brand voice";
const DESCRIPTION =
  "Add your website or describe your business, and Rext writes in your voice.";

/**
 * Setting up a workspace made with "Skip for now" (rext-control task 905): the create page's own
 * form, wait and review, for a workspace that is there already and has no brand voice yet. A
 * workspace that has been set up is sent to its brand voice instead.
 */
export default function WorkspaceSetupPage() {
  usePageTitle(TITLE, DESCRIPTION);
  // The workspace's own detail, which says whether an analysis has ever run.
  const { workspace } = useWorkspace();
  // Only the first answer decides: the set-up's own run moves the status on while it is
  // followed here, and that must not swap the wait for the notice below.
  const notStarted = useRef<boolean | null>(null);
  if (workspace?.id && notStarted.current === null) {
    notStarted.current = workspace.pipeline?.status === "not_started";
  }

  if (!workspace?.id || notStarted.current === null) {
    return (
      <PageSkeleton layout="form" centered label="Loading your workspace..." />
    );
  }

  if (!notStarted.current) {
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
          }}
        />
      </StepColumn>
    </WorkingSurface>
  );
}
