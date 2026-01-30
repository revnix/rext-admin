"use client";

import { PageLayout } from "@/components/page-layout";
import { useWorkspace } from "@/providers/workspace-provider";
import { workspaceRoutes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PersonaCard } from "@/components/personas/persona-card";
import type { Persona } from "@/types/workspace";

import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { usePersonas } from "@/hooks/use-personas";

export default function PersonaForgePage() {
  const { workspace, workspaceSlug } = useWorkspace();
  const { data: personasData, isLoading } = usePersonas(workspace?.id || null);
  const personas = personasData?.personas || [];

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceSlug),
    },
    { label: "Personas" },
  ];

  return (
    <PageLayout
      title="Personas"
      description={`${personas.length} personas created`}
      breadcrumbs={breadcrumbs}
      fullWidth
      actions={
        <div className="flex gap-2">
          <Link href={workspaceRoutes.persona_create(workspaceSlug)}>
            <Button>
              <Plus size={16} className="mr-2" />
              Create Persona
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-8 max-w-[1600px] mx-auto">
        {/* Workspace Recommendations */}
        {/* <div className="space-y-3">
          <div className="flex items-center gap-2 text-foreground font-bold px-1">
            <Lightbulb
              size={20}
              className="text-sky-500 fill-sky-100 dark:fill-sky-900/20"
            />
            <h3 className="text-lg">Workspace Recommendations</h3>
          </div>
          <RecommendationCard onImport={() => {}} />
        </div> */}

        {/* Persona Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Loading personas...
            </div>
          ) : (
            personas
              .filter((p) => p.id) // Ensure persona has an ID
              .map((persona) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona as Persona & { id: string }}
                />
              ))
          )}

          {/* Create New Placeholder */}
          <Link
            href={workspaceRoutes.persona_create(workspaceSlug)}
            className="contents"
          >
            <Card className="border border-dashed border-border shadow-none hover:border-primary/50 hover:bg-accent/50 transition-all bg-transparent flex items-center justify-center min-h-[300px] cursor-pointer group rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center text-center p-6 bg-transparent">
                <div className="h-14 w-14 rounded-2xl bg-card border border-border flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-primary/50 transition-all shadow-sm">
                  <Plus
                    className="text-muted-foreground group-hover:text-primary transition-colors"
                    size={24}
                  />
                </div>
                <h3 className="font-semibold text-foreground mb-1">
                  Create New Persona
                </h3>
                <p className="text-sm text-muted-foreground">
                  Add a new author profile
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
