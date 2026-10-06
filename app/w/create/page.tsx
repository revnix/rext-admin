"use client";

import { useRef } from "react";
import { FormPage, PageSkeleton } from "@/components/layouts";
import { useResourceLimit } from "@/components/subscription/usage-limit-warning";
import { EmptyState } from "@/components/ui/empty-state";
import { Meter } from "@/components/ui/meter";
import { WorkspaceCreateWizard } from "@/components/workspace";
import { usePageTitle } from "@/hooks/use-page-title";

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

  const {
    isLimitReached,
    isLoading: isLimitLoading,
    used,
    max,
  } = useResourceLimit("workspaces");
  const initialLimitReached = useRef<boolean | null>(null);

  // Only the first load decides the gate: creating the last allowed workspace updates the usage
  // while the analysis runs, and that must not swap the run for this gate.
  if (!isLimitLoading && initialLimitReached.current === null) {
    initialLimitReached.current = isLimitReached;
  }

  if (isLimitLoading) {
    return <PageSkeleton layout="form" label="Checking workspace limits..." />;
  }

  if (initialLimitReached.current) {
    return (
      <FormPage
        title="Create workspace"
        description="A workspace for one website: its brand voice, personas and content."
      >
        <EmptyState
          title="Workspace limit reached"
          description={
            max !== null
              ? `Your plan includes ${max} ${max === 1 ? "workspace" : "workspaces"}, and all of them are in use. A bigger plan adds more.`
              : "Your plan's workspaces are all in use. A bigger plan adds more."
          }
          action={{ label: "View plans", href: "/pricing" }}
        />
      </FormPage>
    );
  }

  return (
    <FormPage
      title="Create workspace"
      description="A workspace for one website: its brand voice, personas and content."
    >
      {used !== null && max !== null && (
        <div className="mb-8 space-y-2">
          <p className="num text-table text-muted-foreground">
            {used} of {max} {max === 1 ? "workspace" : "workspaces"} on your
            plan
          </p>
          <Meter value={used} max={max} low={used + 1 >= max} />
        </div>
      )}
      <WorkspaceCreateWizard />
    </FormPage>
  );
}
