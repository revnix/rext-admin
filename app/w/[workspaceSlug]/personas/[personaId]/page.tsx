"use client";

import type { Route } from "next";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DetailPage } from "@/components/layouts";
import {
  PersonaActions,
  PersonaFacts,
  PersonaSections,
} from "@/components/personas/persona-view";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { usePersona, usePersonas } from "@/hooks/use-personas";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

export default function PersonaDetailPage() {
  const { workspace, workspaceSlug } = useWorkspace();
  const { personaId } = useParams<{ personaId: string }>();
  const { data, isLoading, error } = usePersona(
    workspace?.id || null,
    personaId,
  );
  // The list carries each persona's article count; the single persona doesn't.
  const { data: list } = usePersonas(workspace?.id || null);
  const persona = data?.persona;

  if (!workspace || isLoading) {
    return (
      <DetailPage title="Persona" aside={<Skeleton className="h-64 w-full" />}>
        <Skeleton className="h-96 w-full" />
      </DetailPage>
    );
  }

  if (error || !persona) {
    return (
      <DetailPage title="Persona not found">
        <Notice
          tone="danger"
          title="This persona couldn't be found"
          action={
            <Button asChild variant="outline" size="sm">
              <Link href={workspaceRoutes.personas(workspaceSlug) as Route}>
                All personas
              </Link>
            </Button>
          }
        >
          It may have been deleted, or it belongs to another workspace.
        </Notice>
      </DetailPage>
    );
  }

  const articleCount = list?.personas.find(
    (p) => p.id === persona.id,
  )?.article_count;

  return (
    <DetailPage
      title={persona.name}
      description={persona.professional_title || undefined}
      actions={<PersonaActions persona={persona} />}
      aside={<PersonaFacts persona={persona} articleCount={articleCount} />}
    >
      <PersonaSections persona={persona} />
    </DetailPage>
  );
}
