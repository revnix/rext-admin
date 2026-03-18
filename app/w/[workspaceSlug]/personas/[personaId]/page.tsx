"use client";

import { PageLayout } from "@/components/page-layout";
import { useWorkspace } from "@/providers/workspace-provider";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePersona } from "@/hooks/use-personas";
import { PersonaDetail } from "@/components/personas/persona-detail";
import { useParams } from "next/navigation";
import type { Route } from "next";
import type { Persona } from "@/types/workspace";

export default function PersonaDetailPage() {
  const { workspace, workspaceSlug } = useWorkspace();
  const params = useParams();
  const personaId = params.personaId as string;

  const {
    data: personaData,
    isLoading,
    error,
  } = usePersona(workspace?.id || null, personaId);
  const persona = personaData;

  // Wait for workspace to be loaded before considering it an error
  const isWorkspaceLoading = !workspace && !error;
  const isPersonaLoading = isLoading || isWorkspaceLoading;

  // Fallback for loading
  if (isPersonaLoading) {
    return (
      <PageLayout title="Personas">
        <div className="flex items-start p-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-3 text-muted-foreground">Loading persona...</span>
        </div>
      </PageLayout>
    );
  }

  if (error || !persona) {
    return (
      <PageLayout title="Persona Not Found">
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <p className="text-muted-foreground">
            The persona you are looking for does not exist or you do not have
            permission to view it.
          </p>

          <Link href={`/w/${workspaceSlug}/personas` as Route}>
            <Button
              variant="outline"
              className="h-10 px-4 rounded-xl border-slate-200"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Personas
            </Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={persona.name}
      description={(persona as any).description || undefined}
    >
      <PersonaDetail persona={persona as any} />
    </PageLayout>
  );
}
