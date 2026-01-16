"use client";

import { PageLayout } from "@/components/page-layout";
import { useWorkspace } from "@/providers/workspace-provider";
import { workspaceRoutes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Plus, Lightbulb } from "lucide-react";
import { PersonaCard, type Persona } from "@/components/personas/persona-card";
import { RecommendationCard } from "@/components/personas/recommendation-card";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

// Mock Data
const PERSONAS: Persona[] = [
  {
    id: "1",
    name: "Dr. Sarah Mitchell",
    title: "Board-Certified Dermatologist",
    initials: "SM",
    avatarColor: "bg-slate-800",
    expertise: ["Dermatology", "Skincare", "Medical Research"],
    toneOfVoice: "Professional, Empathetic, Evidence-based",
    articlesWritten: 12,
  },
  {
    id: "2",
    name: "Tech Bro Tom",
    title: "Senior Software Engineer",
    initials: "TT",
    avatarColor: "bg-blue-600",
    expertise: ["JavaScript", "React", "Cloud Architecture"],
    toneOfVoice: "Casual, Enthusiastic, Technical",
    articlesWritten: 8,
  },
  {
    id: "3",
    name: "Marketing Maven Maria",
    title: "Digital Marketing Strategist",
    initials: "MM",
    avatarColor: "bg-amber-500",
    expertise: ["SEO", "Content Strategy", "Analytics"],
    toneOfVoice: "Engaging, Data-driven, Creative",
    articlesWritten: 15,
  },
];

export default function PersonaForgePage() {
  const { workspace, workspaceSlug } = useWorkspace();

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
      description={`${PERSONAS.length} personas created`}
      breadcrumbs={breadcrumbs}
      fullWidth
      actions={
        <div className="flex gap-2">
          <Link href={workspaceRoutes.persona_create(workspaceSlug)}>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl">
              <Plus size={16} className="mr-2" />
              Create Persona
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-8 max-w-[1600px] mx-auto">
        {/* Workspace Recommendations */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold px-1">
            <Lightbulb size={20} className="text-sky-500 fill-sky-100" />
            <h3 className="text-lg">Workspace Recommendations</h3>
          </div>
          <RecommendationCard onImport={() => {}} />
        </div>

        {/* Persona Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {PERSONAS.map((persona) => (
            <PersonaCard key={persona.id} persona={persona} />
          ))}

          {/* Create New Placeholder */}
          <Link
            href={workspaceRoutes.persona_create(workspaceSlug)}
            className="contents"
          >
            <Card className="border border-dashed border-slate-200 shadow-none hover:border-primary/50 hover:bg-slate-50/50 transition-all bg-transparent flex items-center justify-center min-h-[300px] cursor-pointer group rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center text-center p-6 bg-transparent">
                <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-primary/50 transition-all shadow-sm">
                  <Plus
                    className="text-slate-400 group-hover:text-primary transition-colors"
                    size={24}
                  />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  Create New Persona
                </h3>
                <p className="text-sm text-slate-500">
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
