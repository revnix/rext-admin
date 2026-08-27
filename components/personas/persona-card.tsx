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
import { ArrowRight, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useWorkspace } from "@/providers/workspace-provider";
import type { Route } from "next";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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

  // Generate a consistent color based on persona name
  const colors = [
    "bg-slate-800",
    "bg-blue-600",
    "bg-amber-500",
    "bg-emerald-600",
    "bg-purple-600",
    "bg-rose-600",
  ];
  const colorIndex = persona.name.charCodeAt(0) % colors.length;
  const avatarColor = colors[colorIndex];

  return (
    <Link
      href={`/w/${workspaceSlug}/personas/${persona.id}` as Route}
      className="block h-full group"
    >
      <Card className="h-full overflow-hidden transition-all hover:shadow-md border-border bg-card flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 rounded-lg shadow-sm">
              <AvatarImage
                src={persona.avatar_url || ""}
                alt={`${persona.name}'s avatar`}
                className="object-cover"
              />
              <AvatarFallback
                className={`rounded-lg ${avatarColor} text-white font-bold text-sm`}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          {/*
            The backend names one persona the brand should write as, chosen on
            provenance and output rather than score alone - a masthead can
            outscore every writer on a site and still have no voice to borrow.
            Without this the choice was returned by the API and visible to
            nobody, so a reader had to infer it from position in a grid.
          */}
          {persona.is_recommended && (
            <Badge
              variant="default"
              className="gap-1 shrink-0 bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20"
            >
              <Star className="h-3 w-3 fill-current" />
              Recommended
            </Badge>
          )}
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
