"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Persona } from "@/types/workspace";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "@/providers/workspace-provider";

interface PersonaCardProps {
  persona: Persona & { id: string };
}

export function PersonaCard({ persona }: PersonaCardProps) {
  const { workspaceSlug } = useWorkspace();

  // Generate initials from name
  const initials = persona.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Use consistent primary brand color for all avatars
  const avatarColor = "bg-primary";

  return (
    <Link
      href={`/w/${workspaceSlug}/personas/${persona.id}`}
      className="block h-full"
    >
      <Card className="h-full overflow-hidden transition-all hover:shadow-md border-border bg-card flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-lg ${avatarColor} flex items-center justify-center text-white font-bold text-sm shadow-sm`}
            >
              {initials}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-2 flex-grow">
          <CardTitle className="text-base font-semibold mb-2 capitalize leading-tight">
            {persona.name}
          </CardTitle>
          <CardDescription className="line-clamp-2 min-h-[2.5rem]">
            {persona.professional_title ||
              persona.description ||
              "No description provided."}
          </CardDescription>
        </CardContent>
        <CardFooter className="flex items-center p-6 pt-0 mt-auto border-none">
          <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
            View Details
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
