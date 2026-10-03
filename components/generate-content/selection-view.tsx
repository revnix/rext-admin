"use client";

import { Sparkles, Library, ArrowRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { LockedFeatureTooltip } from "@/components/permission/locked-feature-tooltip";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";

interface SelectionViewProps {
  onStartFresh: () => void;
  onPickFromLibrary: () => void;
  canCreate?: boolean;
  isPermLoading?: boolean;
}

export function SelectionView({
  onStartFresh,
  onPickFromLibrary,
  canCreate = true,
  isPermLoading = false,
}: SelectionViewProps) {
  const isLocked = !isPermLoading && !canCreate;
  const lockedMessage = "Content generation requires Editor role or above";

  const freshCard = (
    <Card
      className={`group relative overflow-hidden border-border/50 transition-all duration-300 rounded-md bg-card ${
        isLocked ? "" : "hover:border-primary/50 cursor-pointer"
      }`}
      onClick={isLocked ? undefined : onStartFresh}
    >
      <CardHeader className="pt-8 px-8 pb-4">
        <div className="h-14 w-14 rounded-full bg-muted text-foreground flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <Sparkles className="w-7 h-7" />
        </div>
        <CardTitle className="text-2xl font-bold mb-2">Start Fresh</CardTitle>
        <CardDescription className="text-base text-muted-foreground/80">
          Analyze a new keyword and explore the SERP landscape.
        </CardDescription>
      </CardHeader>
      <CardFooter className="px-8 pb-8 pt-4">
        <span className="text-primary dark:text-blue-500 font-medium flex items-center gap-2 group-hover:translate-x-1 transition-transform">
          Begin Research <ArrowRight className="w-4 h-4" />
        </span>
      </CardFooter>
    </Card>
  );

  const libraryCard = (
    <Card
      className={`group relative overflow-hidden border-border/50 transition-all duration-300 rounded-md bg-card ${
        isLocked ? "" : "hover:border-primary/50 cursor-pointer"
      }`}
      onClick={isLocked ? undefined : onPickFromLibrary}
    >
      <CardHeader className="pt-8 px-8 pb-4">
        <div className="h-14 w-14 rounded-full bg-muted text-foreground flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <Library className="w-7 h-7" />
        </div>
        <CardTitle className="text-2xl font-bold mb-2">
          Pick from Library
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground/80">
          Use a previously analyzed keyword to skip the research phase.
        </CardDescription>
      </CardHeader>
      <CardFooter className="px-8 pb-8 pt-4">
        <span className="text-primary dark:text-blue-500 font-medium flex items-center gap-2 group-hover:translate-x-1 transition-transform">
          Browse saved keywords <ArrowRight className="w-4 h-4" />
        </span>
      </CardFooter>
    </Card>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-6 lg:py-0">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          How would you like to start?
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Choose your starting point for building content authority.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        {isLocked ? (
          <LockedFeatureTooltip
            permission={CONTENT_PERMISSIONS.CREATE}
            message={lockedMessage}
          >
            {freshCard}
          </LockedFeatureTooltip>
        ) : (
          freshCard
        )}

        {isLocked ? (
          <LockedFeatureTooltip
            permission={CONTENT_PERMISSIONS.CREATE}
            message={lockedMessage}
          >
            {libraryCard}
          </LockedFeatureTooltip>
        ) : (
          libraryCard
        )}
      </div>
    </div>
  );
}
