"use client";

import { useQuery } from "@tanstack/react-query";
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
import { subscriptionQueries } from "@/lib/query-keys";

/**
 * Creating a workspace (plans/app/D-pages.md §2.9): the plan's workspace count before the form,
 * then the form and the analysis (WorkspaceCreateWizard). A plan already at its cap gets the
 * way to a bigger one instead.
 */
export default function CreateWorkspacePage() {
  usePageTitle(
    "Create workspace",
    "A workspace for one website: its brand voice, personas and content",
  );

  // The plan's workspaces, from GET /subscriptions/usage: the wizard refreshes it once the new
  // workspace exists, so the count includes it during the analysis.
  const usage = useQuery(subscriptionQueries.usage());
  const workspaces = usage.data?.workspaces;
  const used = workspaces?.used ?? null;
  const max = workspaces && !workspaces.unlimited ? workspaces.limit : null;
  const isLimitReached = used !== null && max !== null && used >= max;
  const initialLimitReached = useRef<boolean | null>(null);

  // Only the first load decides the gate: creating the last allowed workspace updates the usage
  // while the analysis runs, and that must not swap the run for this gate. If the usage can't be
  // read, the form shows without a count; creating still checks the limit.
  if (!usage.isPending && initialLimitReached.current === null) {
    initialLimitReached.current = isLimitReached;
  }

  // The skeleton waits for the first decision only. A refetch afterwards (the wizard's, once the
  // workspace exists, or a window refocus after a failed read) puts a query with no data back to
  // pending, and must not unmount the wizard mid-analysis.
  if (initialLimitReached.current === null) {
    return (
      <PageSkeleton
        layout="form"
        centered
        label="Checking workspace limits..."
      />
    );
  }

  if (initialLimitReached.current) {
    return (
      <FormPage
        centered
        title="Create workspace"
        description="A workspace for one website: its brand voice, personas and content."
      >
        <EmptyState
          title="Workspace limit reached"
          description={
            max !== null
              ? max === 1
                ? "Your plan includes 1 workspace, and it's in use. A bigger plan adds more."
                : `Your plan includes ${max} workspaces, and all of them are in use. A bigger plan adds more.`
              : "Your plan's workspaces are all in use. A bigger plan adds more."
          }
          action={{ label: "View plans", href: "/pricing" }}
        />
      </FormPage>
    );
  }

  // A working surface: the workspace beside what happens behind the scenes (rext-control#845).
  // The plan's count is the first step's to show: once the workspace exists it reads "1 of 1" as
  // a full bar, which looks like an error at the very moment one is waiting.
  return (
    <WorkingSurface
      title="Create workspace"
      description="A workspace for one website: its brand voice, personas and content."
    >
      <StepColumn withSidePane>
        <WorkspaceCreateWizard
          planCount={used !== null && max !== null ? { used, max } : null}
        />
      </StepColumn>
    </WorkingSurface>
  );
}
