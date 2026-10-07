"use client";

import { Check, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { PersonaRecommendation } from "@/types/generate-content";
import type { Persona } from "@/types/workspace";

/**
 * Who the article is written as: the workspace's personas, each with its fit
 * for this outline (the backend scores them; the best fit whose expertise covers
 * the subject is recommended, and none when no persona's does), and "No author
 * persona". Choosing the selected persona again clears it.
 */
export function PersonaPicker({
  id,
  personas,
  recommendations,
  selectedId,
  onSelect,
}: {
  id?: string;
  personas: Persona[];
  recommendations: PersonaRecommendation[];
  selectedId: string | null;
  onSelect: (personaId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  // A recommendation without the fit (an outline from before E26) still counts as one.
  const recommendedId =
    recommendations.find(
      (recommendation) => recommendation.fits_topic !== false,
    )?.persona_id ?? null;
  const scoreById = useMemo(
    () =>
      new Map(
        recommendations.map((recommendation) => [
          recommendation.persona_id,
          recommendation.score,
        ]),
      ),
    [recommendations],
  );
  const selected =
    personas.find((persona) => (persona.id || persona.name) === selectedId) ??
    null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-auto min-h-10 w-full justify-between px-3 py-2 text-left"
        >
          <span className="flex min-w-0 flex-col items-start">
            {/* No fallback to personas[0]: showing a persona the user has not
                selected made a cleared selection unreadable. */}
            <span
              className={cn(
                "truncate text-body font-medium",
                selected ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {selected
                ? selected.full_name || selected.name
                : "No author persona"}
            </span>
            {selected?.professional_title && (
              <span className="truncate text-caption text-muted-foreground">
                {selected.professional_title}
              </span>
            )}
          </span>
          <ChevronDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <Command>
          <CommandInput placeholder="Search personas…" />
          <CommandList>
            <CommandEmpty>No persona found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                key="__no_persona__"
                value="No author persona"
                onSelect={() => {
                  onSelect(null);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 size-4",
                    selectedId === null ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="font-medium text-muted-foreground">
                  No author persona
                </span>
              </CommandItem>
              {personas.map((persona) => {
                const personaId = persona.id || persona.name;
                const name = persona.full_name || persona.name;
                const isSelected = selectedId === personaId;
                const score = scoreById.get(personaId);
                return (
                  <CommandItem
                    key={personaId}
                    value={`${name} ${persona.professional_title ?? ""} ${persona.name}`}
                    onSelect={() => {
                      // Selecting the selected persona clears it, so the same
                      // control that picks an author can drop one.
                      onSelect(isSelected ? null : personaId);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="flex min-w-0 flex-1 flex-col items-start">
                      <span className="font-medium">{name}</span>
                      {persona.professional_title && (
                        <span className="text-caption text-muted-foreground">
                          {persona.professional_title}
                        </span>
                      )}
                    </span>
                    <span className="ml-2 flex shrink-0 items-center gap-1.5">
                      {personaId === recommendedId && (
                        <span className="text-caption font-medium text-foreground">
                          Recommended
                        </span>
                      )}
                      {score !== undefined && (
                        <span className="text-caption text-muted-foreground num">
                          {Math.round(score)}% fit
                        </span>
                      )}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
