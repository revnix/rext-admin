"use client";

import { ChevronDown, Lightbulb, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspaceOptional } from "@/providers/workspace-provider";

export function QuickAddDropdown() {
  const workspaceContext = useWorkspaceOptional();
  const workspaceSlug = workspaceContext?.workspaceSlug;

  // Use workspace-scoped route if in workspace context, otherwise fallback to global route
  const topicCreateHref = workspaceSlug
    ? workspaceRoutes.topicCreate(workspaceSlug)
    : "/topics/create";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" className="gap-2">
          <Plus className="h-4 w-4" />
          Quick Action
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link
            href={topicCreateHref}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Lightbulb className="h-4 w-4" />
            Create Topic
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
