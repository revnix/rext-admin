"use client";

import { useParams } from "next/navigation";
import { FormPage } from "@/components/layouts";
import { PersonaForm } from "@/components/personas/persona-form";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { usePersona } from "@/hooks/use-personas";
import { PERSONA_PERMISSIONS } from "@/lib/permissions";
import { useWorkspace } from "@/providers/workspace-provider";

export default function EditPersonaPage() {
  const { workspace, workspaceId } = useWorkspace();
  const { personaId } = useParams<{ personaId: string }>();
  const { hasPermission: canEdit, isLoading: isPermissionLoading } =
    useWorkspacePermission(PERSONA_PERMISSIONS.UPDATE, workspaceId);
  const { data, isLoading, error } = usePersona(
    workspace?.id || null,
    personaId,
  );
  const persona = data?.persona;

  if (!workspace?.id || isLoading || isPermissionLoading) {
    return (
      <FormPage title="Edit persona">
        <Skeleton className="h-96 w-full" />
      </FormPage>
    );
  }

  if (error || !persona) {
    return (
      <FormPage title="Edit persona">
        <Notice tone="danger" title="This persona couldn't be found">
          It may have been deleted. The personas list has the ones that remain.
        </Notice>
      </FormPage>
    );
  }

  return (
    <FormPage title={`Edit ${persona.name}`}>
      {canEdit ? (
        // Keyed by the persona, so the form's starting values are this one's.
        <PersonaForm key={persona.id} persona={persona} />
      ) : (
        <Notice title="Your role can't edit personas">
          Ask the workspace's owner or an admin to change this one.
        </Notice>
      )}
    </FormPage>
  );
}
