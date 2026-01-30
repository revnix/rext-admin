"use client";

import { PageLayout } from "@/components/page-layout";
import { useWorkspace } from "@/providers/workspace-provider";
import { workspaceRoutes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePersona } from "@/hooks/use-personas";
import { PersonaDetail } from "@/components/personas/persona-detail";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
// import { DeletePersonaDialog } from "@/components/personas/delete-persona-dialog"; // Assume checking if this exists or needing to import

export default function PersonaDetailPage() {
    const { workspace, workspaceSlug } = useWorkspace();
    const params = useParams();
    const personaId = params.personaId as string;
    const router = useRouter();

    const { data: personaData, isLoading, error } = usePersona(workspace?.id || null, personaId);
    const persona = personaData?.persona;

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Wait for workspace to be loaded before considering it an error
    const isWorkspaceLoading = !workspace && !error;
    const isPersonaLoading = isLoading || isWorkspaceLoading;

    // Fallback for loading
    if (isPersonaLoading) {
        return (
            <PageLayout
                title="Personas"
                breadcrumbs={[
                    { label: "Dashboard", href: "/" },
                    { label: "Personas", href: `/w/${workspaceSlug}/personas` },
                ]}
            >
                <div className="flex items-start p-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    <span className="ml-3 text-muted-foreground">Loading persona...</span>
                </div>
            </PageLayout>
        );
    }

    if (error || !persona) {
        return (
            <PageLayout
                title="Persona Not Found"
                breadcrumbs={[
                    { label: "Dashboard", href: "/" },
                    { label: "Personas", href: `/w/${workspaceSlug}/personas` },
                    { label: "Not Found" },
                ]}
            >
                <div className="flex flex-col items-center justify-center p-12 space-y-4">
                    <p className="text-muted-foreground">The persona you are looking for does not exist or you do not have permission to view it.</p>

                    <Link href={`/w/${workspaceSlug}/personas`}>
                        <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200">
                            <ArrowLeft size={16} className="mr-2" />
                            Back to Personas
                        </Button>
                    </Link>
                </div>
            </PageLayout>
        );
    }

    const breadcrumbs = [
        { label: "Dashboard", href: "/" },
        {
            label: workspace?.title || "...",
            href: workspaceRoutes.root(workspaceSlug),
        },
        { label: "Personas", href: `/w/${workspaceSlug}/personas` },
        { label: persona.name },
    ];

    return (
        <PageLayout
            title={persona.name}
            description={persona.description}
            breadcrumbs={breadcrumbs}
            fullWidth
            actions={
                <div className="flex gap-2">
                    <Link href={`/w/${workspaceSlug}/personas`}>
                        <Button variant="default" size="sm">
                            <ArrowLeft size={16} className="mr-2" />
                            Back to Personas
                        </Button>
                    </Link>
                    {/* Add Edit/Delete actions here if needed in future */}
                </div>
            }
        >
            <PersonaDetail persona={persona} />
        </PageLayout>
    );
}
