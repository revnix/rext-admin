"use client";

import { ChevronDown, Lightbulb, Plus, Workflow } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function QuickAddDropdown() {
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
          <Link href="/ideas/create" className="flex items-center gap-2 cursor-pointer">
            <Lightbulb className="h-4 w-4" />
            Create Idea
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/flows/create" className="flex items-center gap-2 cursor-pointer">
            <Workflow className="h-4 w-4" />
            Create Flow
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}