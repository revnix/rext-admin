"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Audience } from "@/types/workspace";
import { ArrowRight, Users } from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "@/providers/workspace-provider";
import type { Route } from "next";

interface AudienceCardProps {
  audience: Audience & { id: string };
}

export function AudienceCard({ audience }: AudienceCardProps) {
  const { workspaceSlug } = useWorkspace();

  return (
    <Link
      href={`/w/${workspaceSlug}/audiences/${audience.id}` as Route}
      className="block h-full group"
    >
      <Card className="h-full overflow-hidden transition-all hover:shadow-md border-border bg-card flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
          </div>
          {audience.buying_stage && (
            <Badge variant="outline" className="text-xs capitalize">
              {audience.buying_stage}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-6 pt-2 flex-grow">
          <CardTitle className="text-base font-semibold mb-2 leading-tight">
            {audience.name}
          </CardTitle>
          <CardDescription className="line-clamp-2 min-h-[2.5rem]">
            {audience.description || "No description provided."}
          </CardDescription>
          {(audience.pain_points?.length ?? 0) > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {audience.pain_points?.slice(0, 3).map((point) => (
                <Badge key={point} variant="secondary" className="text-xs">
                  {point}
                </Badge>
              ))}
            </div>
          )}
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
