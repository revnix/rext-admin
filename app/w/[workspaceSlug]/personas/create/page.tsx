"use client";

import { FormPage } from "@/components/layouts";
import { PersonaForm } from "@/components/personas/persona-form";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { PERSONA_PERMISSIONS } from "@/lib/permissions";
import { useWorkspace } from "@/providers/workspace-provider";

const TITLE = "New persona";
const DESCRIPTION =
  "An author persona your articles are written as, for their experience and trust signals.";

export default function CreatePersonaPage() {
  const { workspace, workspaceId } = useWorkspace();
  const { hasPermission: canCreate, isLoading } = useWorkspacePermission(
    PERSONA_PERMISSIONS.CREATE,
    workspaceId,
  );

  return (
    <FormPage title={TITLE} description={DESCRIPTION}>
      {!workspace?.id || isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : canCreate ? (
        <PersonaForm />
      ) : (
        <Notice title="Your role can't create personas">
          Ask the workspace's owner or an admin to add one.
        </Notice>
      )}
    </FormPage>
  );
}
